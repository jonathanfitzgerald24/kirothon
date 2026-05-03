import { PrismaClient, Role, PlacementStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  // Clean up existing demo data
  await prisma.tag.deleteMany({})
  await prisma.favorite.deleteMany({})
  await prisma.quickAccessFile.deleteMany({})
  await prisma.fileMeta.deleteMany({})
  await prisma.accessGrant.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.club.deleteMany({})

  // Create demo club
  const club = await prisma.club.create({
    data: {
      name: 'Alpha Beta Gamma',
      clubType: 'greek_life',
      driveConnected: true,
      setupStep: 4,
      demoMode: true,
      driftUnresolvedCount: 0,
    },
  })

  // Create users
  const adminHash = await bcrypt.hash('demo1234', 10)
  const modHash = await bcrypt.hash('demo1234', 10)
  const memberHash = await bcrypt.hash('demo1234', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.intakeflow.app',
      passwordHash: adminHash,
      displayName: 'Alex Admin',
      role: Role.ADMIN,
      clubId: club.id,
      firstLoginComplete: true,
    },
  })

  const mod = await prisma.user.create({
    data: {
      email: 'mod@demo.intakeflow.app',
      passwordHash: modHash,
      displayName: 'Morgan Mod',
      role: Role.MOD,
      clubId: club.id,
      firstLoginComplete: true,
    },
  })

  const member = await prisma.user.create({
    data: {
      email: 'member@demo.intakeflow.app',
      passwordHash: memberHash,
      displayName: 'Sam Member',
      role: Role.MEMBER,
      clubId: club.id,
      firstLoginComplete: true,
    },
  })

  // Create category tree
  const recruitment = await prisma.category.create({
    data: {
      name: 'Recruitment',
      clubId: club.id,
      driveFolderId: 'drive-folder-1',
      description: 'All recruitment materials and rush event documents.',
      sortOrder: 0,
    },
  })
  const finance = await prisma.category.create({
    data: {
      name: 'Finance',
      clubId: club.id,
      driveFolderId: 'drive-folder-2',
      description: 'Budget reports, dues tracking, and financial records.',
      sortOrder: 1,
      minimumRole: Role.MOD,
    },
  })
  const events = await prisma.category.create({
    data: {
      name: 'Events',
      clubId: club.id,
      driveFolderId: 'drive-folder-3',
      description: 'Event planning documents, flyers, and recaps.',
      sortOrder: 2,
    },
  })
  const meetingNotes = await prisma.category.create({
    data: {
      name: 'Meeting Notes',
      clubId: club.id,
      driveFolderId: 'drive-folder-4',
      description: 'Weekly chapter meeting agendas and minutes.',
      sortOrder: 3,
    },
  })
  const marketing = await prisma.category.create({
    data: {
      name: 'Marketing',
      clubId: club.id,
      driveFolderId: 'drive-folder-5',
      description: 'Social media assets, brand guidelines, and promotional materials.',
      sortOrder: 4,
    },
  })
  const memberResources = await prisma.category.create({
    data: {
      name: 'Member Resources',
      clubId: club.id,
      driveFolderId: 'drive-folder-6',
      description: 'Onboarding guides, bylaws, and member handbooks.',
      sortOrder: 5,
    },
  })
  const rushEvents = await prisma.category.create({
    data: {
      name: 'Rush Events',
      clubId: club.id,
      parentId: recruitment.id,
      driveFolderId: 'drive-folder-7',
      description: 'Rush week schedules and event details.',
      sortOrder: 0,
    },
  })

  // Create files
  const file1 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: recruitment.id,
      driveFileId: 'drive-file-1',
      name: 'Rush 2024 Interest Form.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(245000),
      uploaderId: admin.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 95,
      routingExplanation: 'Filename and type strongly match the Recruitment folder purpose.',
      aiSummary: 'Interest form for prospective members during Fall 2024 rush.',
    },
  })
  const file2 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: finance.id,
      driveFileId: 'drive-file-2',
      name: 'Spring 2024 Budget.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: BigInt(87000),
      uploaderId: mod.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 92,
      routingExplanation: 'Spreadsheet with budget in filename matches Finance folder.',
      aiSummary: 'Spring semester budget breakdown including dues, events, and operational costs.',
    },
  })
  const file3 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: events.id,
      driveFileId: 'drive-file-3',
      name: 'Formal 2024 Flyer.png',
      mimeType: 'image/png',
      sizeBytes: BigInt(1200000),
      uploaderId: mod.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 88,
      routingExplanation: 'Image flyer matches Events folder based on filename.',
      aiSummary: 'Promotional flyer for the annual formal event.',
    },
  })
  const file4 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: meetingNotes.id,
      driveFileId: 'drive-file-4',
      name: 'Chapter Meeting Minutes - Oct 15.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: BigInt(34000),
      uploaderId: admin.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 97,
      routingExplanation: 'Meeting minutes document strongly matches Meeting Notes folder.',
      aiSummary: 'Minutes from the October 15th chapter meeting covering budget approval and event planning.',
    },
  })
  const file5 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: marketing.id,
      driveFileId: 'drive-file-5',
      name: 'Brand Guidelines 2024.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(3400000),
      uploaderId: admin.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 91,
      routingExplanation: 'Brand guidelines PDF matches Marketing folder.',
      aiSummary: 'Official brand guidelines including logo usage, colors, and typography standards.',
    },
  })
  const file6 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: memberResources.id,
      driveFileId: 'drive-file-6',
      name: 'New Member Handbook.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(890000),
      uploaderId: admin.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 99,
      routingExplanation: 'Member handbook PDF strongly matches Member Resources folder.',
      aiSummary: 'Comprehensive guide for new members covering expectations, events, and chapter history.',
    },
  })
  const file7 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: rushEvents.id,
      driveFileId: 'drive-file-7',
      name: 'Rush Week Schedule Fall 2024.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(156000),
      uploaderId: mod.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 94,
      routingExplanation: 'Rush schedule matches Rush Events subfolder.',
      aiSummary: 'Day-by-day schedule for Fall 2024 rush week events.',
    },
  })
  const file8 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: finance.id,
      driveFileId: 'drive-file-8',
      name: 'Dues Collection Tracker.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: BigInt(45000),
      uploaderId: mod.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 93,
      routingExplanation: 'Dues tracker spreadsheet matches Finance folder.',
      aiSummary: 'Tracks member dues payments for the current semester.',
    },
  })
  const file9 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: events.id,
      driveFileId: 'drive-file-9',
      name: 'Philanthropy Event Recap.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: BigInt(67000),
      uploaderId: member.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 86,
      routingExplanation: 'Event recap document matches Events folder.',
      aiSummary: 'Summary of the annual philanthropy event including attendance and funds raised.',
    },
  })
  const file10 = await prisma.fileMeta.create({
    data: {
      clubId: club.id,
      categoryId: memberResources.id,
      driveFileId: 'drive-file-10',
      name: 'Chapter Bylaws 2024.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(234000),
      uploaderId: admin.id,
      placementStatus: PlacementStatus.PLACED,
      confidenceScore: 98,
      routingExplanation: 'Bylaws document strongly matches Member Resources folder.',
      aiSummary: 'Official chapter bylaws governing membership, elections, and operations.',
    },
  })

  // Create tags
  const tagData = [
    { fileId: file1.id, tags: ['recruitment', 'rush', 'forms'] },
    { fileId: file2.id, tags: ['budget', 'finance', 'spring-2024'] },
    { fileId: file3.id, tags: ['events', 'formal', 'flyer'] },
    { fileId: file4.id, tags: ['meeting', 'minutes', 'october'] },
    { fileId: file5.id, tags: ['branding', 'marketing', 'design'] },
    { fileId: file6.id, tags: ['handbook', 'onboarding', 'members'] },
    { fileId: file7.id, tags: ['rush', 'schedule', 'fall-2024'] },
    { fileId: file8.id, tags: ['dues', 'finance', 'tracker'] },
    { fileId: file9.id, tags: ['philanthropy', 'events', 'recap'] },
    { fileId: file10.id, tags: ['bylaws', 'governance', 'official'] },
  ]

  for (const { fileId, tags } of tagData) {
    for (const name of tags) {
      await prisma.tag.create({ data: { fileId, name, autoGen: true } })
    }
  }

  // Quick access files
  await prisma.quickAccessFile.create({ data: { clubId: club.id, fileId: file6.id, sortOrder: 0 } })
  await prisma.quickAccessFile.create({ data: { clubId: club.id, fileId: file10.id, sortOrder: 1 } })

  // Favorites
  await prisma.favorite.create({ data: { userId: member.id, fileId: file6.id } })
  await prisma.favorite.create({ data: { userId: member.id, fileId: file10.id } })

  console.log('✅ Demo seed complete!')
  console.log(`   Club: ${club.name} (${club.id})`)
  console.log(`   Users: admin@demo.intakeflow.app / mod@demo.intakeflow.app / member@demo.intakeflow.app`)
  console.log(`   Password for all: demo1234`)
  console.log(`   Categories: 7 | Files: 10 | Tags: 30`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
