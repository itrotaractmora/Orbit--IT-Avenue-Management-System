import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('SERVICE_KEY:', supabaseServiceKey ? `SET (${supabaseServiceKey.substring(0, 10)}...)` : 'MISSING')

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  const testEmail = 'vibodhaherath2004@gmail.com'
  
  // First check if user already exists in Supabase
  console.log('\n1. Listing all existing Supabase Auth users...')
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError.message)
    return
  }
  
  console.log(`Found ${users.length} users in Supabase Auth:`)
  for (const u of users) {
    console.log(`  - ${u.email} (id: ${u.id}, banned: ${u.banned_until ? 'YES until ' + u.banned_until : 'NO'}, confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'})`)
  }
  
  const existingUser = users.find(u => u.email === testEmail)
  if (existingUser) {
    console.log(`\n⚠️  User ${testEmail} already exists in Supabase! This will cause inviteUserByEmail to fail.`)
    console.log(`   Deleting existing user first...`)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
    if (deleteError) {
      console.error('   Delete failed:', deleteError.message)
      return
    }
    console.log('   ✅ Deleted successfully.')
  }
  
  // Now try the invite
  console.log(`\n2. Attempting to invite ${testEmail}...`)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(testEmail, {
    data: { name: 'Test User' }
  })
  
  if (authError) {
    console.error('❌ Invite FAILED:', authError.message)
    console.error('   Full error:', JSON.stringify(authError, null, 2))
    return
  }
  
  if (!authData.user) {
    console.error('❌ Invite returned no user data')
    return
  }
  
  console.log('✅ Invite SUCCEEDED!')
  console.log(`   User ID: ${authData.user.id}`)
  console.log(`   Email: ${authData.user.email}`)
  console.log(`   Created at: ${authData.user.created_at}`)
}

main().catch(e => {
  console.error('Script error:', e)
  process.exit(1)
})
