import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. Extract the Authorization Header (WSTG-ATHN-004)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // 2. Validate the JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // 3. Fetch the data belonging strictly to this user
    const { data, error: dbError } = await supabase
      .from('metadata')
      .select('id, original_filename, file_size, integrity_hash, created_at')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')

    if (dbError) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // 4. Return the secure JSON payload
    return NextResponse.json({
      success: true,
      owner_id: user.id,
      count: data.length,
      data: data
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
