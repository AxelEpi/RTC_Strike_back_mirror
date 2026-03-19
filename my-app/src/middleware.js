// middleware.js
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("auth/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const isServerDetail = segments[0] === "servers" && segments.length === 2;

  if (isServerDetail) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:4000";
    if (apiBase) {
      const serverId = segments[1];
      const checkUrl = new URL(`/servers/${serverId}/members/me`, apiBase);

      try {
        const res = await fetch(checkUrl, {
          method: "GET",
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.role?.toUpperCase?.() === "BANNED") {
            return NextResponse.redirect(new URL("/servers", request.url));
          }
        }
      } catch (e) {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

// Configurer les routes protégées
export const config = {
  matcher: ["/servers/:path*", "/auth/update"],
};
