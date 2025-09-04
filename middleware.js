// Middleware to protect all routes except /api/auth
export const config = {
  matcher: '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
};

export default function middleware(req) {
  // This runs on Vercel's Edge Runtime
  // For static site, we'll handle auth client-side
  // This is here if you want to add server-side route protection later
  return Response.next();
}