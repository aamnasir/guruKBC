import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 1. Jalankan sinkronisasi cookie antara browser dan serverless Vercel
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Ambil data pengguna secara valid dari server Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Batasi proteksi halaman (Ubah '/auth' sesuai nama halaman login Anda)
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth'; // Jika belum login, paksa ke halaman auth
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Lindungi semua halaman, kecualikan static assets dan gambar
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
