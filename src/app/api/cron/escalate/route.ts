import { escalateStalledTasks } from '@/actions/taskActions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  // Basic security check: ensure only authorized services can trigger the cron
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await escalateStalledTasks(true)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: result.success })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
