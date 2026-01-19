import { NextRequest, NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"',
    },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // защищаем всё, что начинается на /admin
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) return unauthorized();

  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Basic ')) return unauthorized();

  const base64 = auth.slice('Basic '.length);
  let decoded = '';
  try {
    decoded = atob(base64);
  } catch {
    return unauthorized();
  }

  // формат "username:password"
  const parts = decoded.split(':');
  const providedPassword = parts.slice(1).join(':'); // на случай двоеточий в пароле

  if (providedPassword !== password) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};