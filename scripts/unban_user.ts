import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  // Unban vibodha.24@cse.mrt.ac.lk
  const userId = 'fd4b9254-fc87-4a68-95a8-eb39066654d5'
  console.log('Unbanning vibodha.24@cse.mrt.ac.lk ...')
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: 'none'
  })
  if (error) {
    console.error('Failed to unban:', error.message)
  } else {
    console.log('✅ User unbanned successfully!')
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
