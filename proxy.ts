import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/signup"];

/** Signed-out visitors go to /login; signed-in ones skip the login and sign-up screens. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = request.cookies.has("unigo_session");
  const onAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!signedIn && !onAuthPage) return NextResponse.redirect(new URL("/login", request.url));
  if (signedIn && onAuthPage) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  // Skip Next internals and the files in public/.
  matcher: ["/((?!_next/|figma/|img/|icons/|favicon.ico|sw.js).*)"],
};
