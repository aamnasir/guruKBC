import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Harga contoh -- silakan sesuaikan dengan strategi harga Anda sendiri.
const PRICES: Record<"user" | "school", { amount: number; label: string }> = {
  user: { amount: 99000, label: "GuruKBC Pro - Guru (tahunan)" },
  school: { amount: 2000000, label: "GuruKBC Pro - Sekolah/Madrasah (tahunan)" },
};

const MANAGER_ROLES = ["admin", "super_admin", "owner", "principal"];

export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return NextResponse.json(
      { error: "Pembayaran belum dikonfigurasi. Admin perlu menambahkan MIDTRANS_SERVER_KEY di Vercel." },
      { status: 503 }
    );
  }

  const supabase = await createRouteClient();
  if (!supabase) return NextResponse.json({ error: "Layanan belum dikonfigurasi." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Anda belum masuk." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const targetType: "user" | "school" = body.targetType === "school" ? "school" : "user";

  let targetId = user.id;
  if (targetType === "school") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !(profile as { school_id: string | null }).school_id) {
      return NextResponse.json({ error: "Anda belum tergabung ke sekolah/madrasah mana pun." }, { status: 400 });
    }
    if (!MANAGER_ROLES.includes((profile as { role: string }).role)) {
      return NextResponse.json({ error: "Hanya kepala sekolah/madrasah atau admin yang bisa upgrade paket sekolah." }, { status: 403 });
    }
    targetId = (profile as { school_id: string }).school_id;
  }

  const price = PRICES[targetType];
  const orderId = `${targetType}-${targetId}-${Date.now()}`;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Pembayaran belum dikonfigurasi. Admin perlu menambahkan SUPABASE_SERVICE_ROLE_KEY di Vercel." },
      { status: 503 }
    );
  }

  const { error: insertError } = await admin.from("payment_orders").insert({
    order_id: orderId,
    target_type: targetType,
    target_id: targetId,
    amount: price.amount,
    status: "pending",
    created_by: user.id,
  });
  if (insertError) {
    console.error("payment_orders insert error:", insertError);
    return NextResponse.json({ error: `Gagal membuat pesanan pembayaran: ${insertError.message}` }, { status: 500 });
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  try {
    const midtransResponse = await fetch(snapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: price.amount },
        customer_details: {
          email: user.email,
          first_name: (user.user_metadata?.full_name as string) || "Guru",
        },
        item_details: [{ id: targetType, price: price.amount, quantity: 1, name: price.label }],
      }),
    });

    if (!midtransResponse.ok) {
      const detail = await midtransResponse.text();
      console.error("Midtrans create transaction error:", midtransResponse.status, detail);
      return NextResponse.json({ error: "Gagal membuat transaksi pembayaran. Coba lagi beberapa saat lagi." }, { status: 502 });
    }

    const midtransData = (await midtransResponse.json()) as { token: string; redirect_url: string };
    return NextResponse.json({ token: midtransData.token, redirectUrl: midtransData.redirect_url, orderId });
  } catch (error) {
    console.error("Midtrans create-transaction error:", error);
    return NextResponse.json({ error: "Tidak dapat terhubung ke Midtrans." }, { status: 500 });
  }
}
