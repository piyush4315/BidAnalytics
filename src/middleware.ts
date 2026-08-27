import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
const PUBLIC = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const token = req.cookies.get("bidledger_session")?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (isPublic) {
    if (ok && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
