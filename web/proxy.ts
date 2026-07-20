import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // JIKA ENV BELUM TERBACA DI SISI EDGE SERVER VERCEL, JANGAN CRASH!
  // Biarkan request lewat sementara waktu demi menghindari redirect loop
  if (!url || !key) {
    console.warn("Edge Runtime: Supabase environment variables are not ready yet.");
    return supabaseResponse;
  }

  // Jalankan sinkronisasi cookie secara aman tanpa tanda seru (!)
  const supabase = createServerClient(url, key, {
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
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  // Proteksi halaman: Jika user tidak ada dan bukan di halaman auth, tendang ke /auth
  if (!user && !isAuthPage) {
    const urlTarget = request.nextUrl.clone();
    urlTarget.pathname = '/auth';
    return NextResponse.redirect(urlTarget);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
