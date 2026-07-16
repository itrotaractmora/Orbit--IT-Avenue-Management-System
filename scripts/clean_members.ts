import 'dotenv/config'
import { prisma } from '../src/utils/prisma'
import { createClient } from '@supabase/supabase-js'

// Make sure these are set in your .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('Finding all MEMBER users...')
  const members = await prisma.user.findMany({
    where: { role: 'MEMBER' }
  })

  if (members.length === 0) {
    console.log('No members found to delete.')
    return
  }

  const memberIds = members.map(m => m.id)
  console.log(`Found ${members.length} members. Deleting related records...`)

  // 1. Delete notifications related to members
  await prisma.notification.deleteMany({
    where: { userId: { in: memberIds } }
  })

  // 2. Delete approvals made by members
  await prisma.approval.deleteMany({
    where: { decidedById: { in: memberIds } }
  })

  // 3. Find tasks related to members
  const tasksToDelete = await prisma.task.findMany({
    where: {
      OR: [
        { createdById: { in: memberIds } },
        { assignees: { some: { id: { in: memberIds } } } },
        { approverId: { in: memberIds } }
      ]
    }
  })
  
  if (tasksToDelete.length > 0) {
    const taskIds = tasksToDelete.map(t => t.id)
    // Delete notifications and approvals for those tasks to satisfy foreign keys
    await prisma.notification.deleteMany({ where: { taskId: { in: taskIds } } })
    await prisma.approval.deleteMany({ where: { taskId: { in: taskIds } } })
    
    // Delete the tasks
    await prisma.task.deleteMany({ where: { id: { in: taskIds } } })
  }

  // 4. Delete Users from Prisma
  console.log('Deleting users from Prisma...')
  await prisma.user.deleteMany({
    where: { role: 'MEMBER' }
  })

  // 5. Delete Users from Supabase Auth
  console.log('Deleting users from Supabase Auth...')
  for (const id of memberIds) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) {
      console.error(`Failed to delete auth user ${id}:`, error.message)
    } else {
      console.log(`Deleted auth user ${id}`)
    }
  }

  console.log('Cleanup complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
