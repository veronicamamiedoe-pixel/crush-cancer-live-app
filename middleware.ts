import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PUBLIC_ROUTES  = ['/', '/auth/login', '/auth/signup', '/auth/reset-password', '/auth/callback', '/auth/confirm']
const PREMIUM_ROUTES = ['/ai-assistant']
const SUPPORT_ROUTES = ['/documents', '/library']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect unauthenticated users
  if (!session && !PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (session && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check premium access
  if (session && PREMIUM_ROUTES.some(r => pathname.startsWith(r))) {
    const { data: sub } = await supabase
      .from('subscriptions').select('plan').eq('user_id', session.user.id).single()
    if (!sub || sub.plan !== 'premium') {
      return NextResponse.redirect(new URL('/settings/billing?upgrade=premium', request.url))
    }
  }

  // Check support+ access
  if (session && SUPPORT_ROUTES.some(r => pathname.startsWith(r))) {
    const { data: sub } = await supabase
      .from('subscriptions').select('plan').eq('user_id', session.user.id).single()
    if (!sub || sub.plan === 'free') {
      return NextResponse.redirect(new URL('/settings/billing?upgrade=support', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
