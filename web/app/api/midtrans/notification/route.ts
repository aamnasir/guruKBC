import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
};

export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as MidtransNotification | null;
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ error: "Payload tidak lengkap" }, { status: 400 });
  }

  // Wajib: verifikasi tanda tangan supaya notifikasi benar-benar dari Midtrans,
  // bukan orang lain yang menembak endpoint ini langsung untuk "membeli gratis".
  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");

  if (expectedSignature !== signature_key) {
    console.error("Midtrans: tanda tangan tidak cocok untuk order", order_id);
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: order } = await admin.from("payment_orders").select("*").eq("order_id", order_id).maybeSingle();
  if (!order) {
    console.error("Midtrans: order_id tidak dikenali:", order_id);
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  const typedOrder = order as { amount: number; target_type: "user" | "school"; target_id: string; status: string };

  // Wajib: jumlah yang dibayar harus sama persis dengan yang kita buat di awal.
  if (Number(gross_amount) !== Number(typedOrder.amount)) {
    console.error("Midtrans: jumlah tidak cocok untuk order", order_id, gross_amount, typedOrder.amount);
    return NextResponse.json({ error: "Jumlah tidak cocok" }, { status: 400 });
  }

  const isPaid = transaction_status === "settlement" || (transaction_status === "capture" && fraud_status === "accept");
  const isFailed = transaction_status === "deny" || transaction_status === "cancel" || transaction_status === "expire";

  if (isPaid && typedOrder.status !== "paid") {
    await admin.from("payment_orders").update({ status: "paid" }).eq("order_id", order_id);

    const table = typedOrder.target_type === "school" ? "school_subscriptions" : "user_subscriptions";
    const idColumn = typedOrder.target_type === "school" ? "school_id" : "user_id";
    const { error: upgradeError } = await admin
      .from(table)
      .upsert({ [idColumn]: typedOrder.target_id, plan: "pro" }, { onConflict: idColumn });

    if (upgradeError) {
      console.error("Midtrans: gagal upgrade plan untuk order", order_id, upgradeError);
      return NextResponse.json({ error: "Gagal memperbarui status langganan" }, { status: 500 });
    }
  } else if (isFailed) {
    await admin
      .from("payment_orders")
      .update({ status: transaction_status === "expire" ? "expired" : "failed" })
      .eq("order_id", order_id);
  }

  return NextResponse.json({ received: true });
}
