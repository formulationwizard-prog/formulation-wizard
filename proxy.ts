import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

function verifyCookie(value: string, secret: string): boolean {
  try {
    const lastDot = value.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === value.length - 1) return false;

    const payload = value.slice(0, lastDot);
    const signature = value.slice(lastDot + 1);

    const expected = createHmac("sha256", secret).update(payload).digest("hex");

    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length === 0 || a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/workspace")) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    loginUrl.searchParams.set("error", "server_misconfigured");
    return NextResponse.redirect(loginUrl);
  }

  const cookie = request.cookies.get("fw_access");
  if (!cookie || !verifyCookie(cookie.value, secret)) {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|marketing|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
