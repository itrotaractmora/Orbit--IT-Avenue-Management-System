import 'dotenv/config'
import { prisma } from '../src/utils/prisma'
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
  console.log('Fetching all users from Prisma...')
  const prismaUsers = await prisma.user.findMany()
  const prismaUserIds = new Set(prismaUsers.map(u => u.id))

  console.log('Fetching all users from Supabase Auth...')
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching Supabase users:', error.message)
    return
  }

  let deletedCount = 0
  for (const user of users) {
    if (!prismaUserIds.has(user.id)) {
      console.log(`User ${user.email} (${user.id}) is in Supabase but not Prisma. Deleting...`)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
      deletedCount++
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} orphaned Supabase users.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
