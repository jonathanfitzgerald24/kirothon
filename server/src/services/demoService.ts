import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import { randomUUID } from 'crypto'

export class DemoService {
  async createDemoClub() {
    const club = await prisma.club.create({
      data: {
        name: 'Demo Club',
        clubType: 'academic_club',
        demoMode: true,
        driveConnected: true,
        setupStep: 4,
      },
    })

    // Create demo admin user
    const user = await prisma.user.create({
      data: {
        email: `demo-${randomUUID().slice(0, 8)}@intakeflow.demo`,
        displayName: 'Demo Admin',
        role: Role.ADMIN,
        clubId: club.id,
        firstLoginComplete: true,
      },
    })

    // Create sample categories
    const folders = ['Meeting Notes', 'Budgets', 'Events', 'Marketing', 'Membership']
    const categories = await Promise.all(
      folders.map((name, i) =>
        prisma.category.create({
          data: {
            clubId: club.id,
            name,
            sortOrder: i,
            description: `${name} for the club`,
          },
        })
      )
    )

    // Create sample files
    const sampleFiles = [
      { name: 'Q1 Budget Report.pdf', mimeType: 'application/pdf', categoryIdx: 1 },
      { name: 'Spring Kickoff Agenda.docx', mimeType: 'application/vnd.google-apps.document', categoryIdx: 0 },
      { name: 'Event Flyer.png', mimeType: 'image/png', categoryIdx: 3 },
      { name: 'Member Roster 2026.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet', categoryIdx: 4 },
      { name: 'Fundraiser Recap.pdf', mimeType: 'application/pdf', categoryIdx: 2 },
    ]

    for (const sf of sampleFiles) {
      await prisma.fileMeta.create({
        data: {
          clubId: club.id,
          categoryId: categories[sf.categoryIdx].id,
          driveFileId: `demo-${randomUUID()}`,
          name: sf.name,
          mimeType: sf.mimeType,
          sizeBytes: BigInt(Math.floor(Math.random() * 5000000)),
          uploaderId: user.id,
          placementStatus: 'PLACED',
          aiSummary: `Demo file: ${sf.name}`,
        },
      })
    }

    return { club, user }
  }

  async cleanupExpiredDemos() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const expiredClubs = await prisma.club.findMany({
      where: { demoMode: true, createdAt: { lt: cutoff } },
      select: { id: true },
    })

    for (const club of expiredClubs) {
      // Cascade delete all related data
      await prisma.fileMeta.deleteMany({ where: { clubId: club.id } })
      await prisma.category.deleteMany({ where: { clubId: club.id } })
      await prisma.auditLog.deleteMany({ where: { clubId: club.id } })
      await prisma.notification.deleteMany({ where: { clubId: club.id } })
      await prisma.user.deleteMany({ where: { clubId: club.id } })
      await prisma.club.delete({ where: { id: club.id } })
    }

    return expiredClubs.length
  }
}

export const demoService = new DemoService()
