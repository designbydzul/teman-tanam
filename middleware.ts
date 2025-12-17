import { NextResponse, type NextRequest } from 'next/server';

// Middleware disabled for OAuth implicit flow
// Session management is handled entirely client-side
export async function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
