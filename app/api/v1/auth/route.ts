import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Standard Supabase client for pure API interactions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Authenticate and generate the JWT
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Return standard RESTful Bearer payload
    return NextResponse.json({
      success: true,
      access_token: data.session.access_token,
      token_type: 'Bearer',
      expires_in: data.session.expires_in
    })

  } catch (error) {
    return NextResponse.json({ error: 'Malformed Request' }, { status: 400 })
  }
}
