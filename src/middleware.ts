import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'parisar-dhsgsu-sagar-jwt-signing-secret-key-2026-v3';

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function verifyAdminJwtEdge(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(signatureB64);
    const isValidSig = await crypto.subtle.verify('HMAC', key, signature.buffer as ArrayBuffer, data);
    if (!isValidSig) return false;

    const payloadBytes = base64UrlToUint8Array(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as {
      role?: string;
      status?: string;
      exp?: number;
    };

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }

    if (payload.role !== 'admin') {
      return false;
    }

    if (payload.status && payload.status !== 'ACTIVE') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Server-side Route Protection for /admin and /admin/* (Section 3).
 * Directly opening /admin, /admin/users, /admin/events, /admin/administrators, /admin/audit, etc.
 * without a valid signed admin session cookie redirects to /admin/login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token =
      req.cookies.get('parisar_token')?.value ||
      req.cookies.get('parisar_admin_session')?.value ||
      null;

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isValidAdmin = await verifyAdminJwtEdge(token);
    if (!isValidAdmin) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
