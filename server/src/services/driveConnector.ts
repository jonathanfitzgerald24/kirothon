import { google, drive_v3, Auth } from 'googleapis'
import { prisma } from '../lib/prisma'
import { encrypt, decrypt } from '../lib/encryption'

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive']

export class DriveConnector {
  private clubId: string

  constructor(clubId: string) {
    this.clubId = clubId
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/drive/callback`
    )
  }

  generateAuthUrl(): string {
    const oauth2Client = this.createOAuth2Client()
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: DRIVE_SCOPES,
      prompt: 'consent',
      state: this.clubId,
    })
  }

  async exchangeCodeForTokens(code: string): Promise<void> {
    const oauth2Client = this.createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) throw new Error('No access token received')

    await prisma.club.update({
      where: { id: this.clubId },
      data: {
        driveConnected: true,
        driveAccessToken: encrypt(tokens.access_token),
        driveRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        driveTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  }

  async getAuthenticatedClient(): Promise<Auth.OAuth2Client> {
    const club = await prisma.club.findUnique({ where: { id: this.clubId } })
    if (!club || !club.driveAccessToken) throw new Error('Drive not connected for this club')

    const oauth2Client = this.createOAuth2Client()
    const accessToken = decrypt(club.driveAccessToken)
    const refreshToken = club.driveRefreshToken ? decrypt(club.driveRefreshToken) : undefined

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: club.driveTokenExpiry?.getTime(),
    })

    // Auto-refresh if expired (task 4.7)
    if (club.driveTokenExpiry && club.driveTokenExpiry <= new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken()
      await prisma.club.update({
        where: { id: this.clubId },
        data: {
          driveAccessToken: encrypt(credentials.access_token!),
          driveTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        },
      })
      oauth2Client.setCredentials(credentials)
    }

    return oauth2Client
  }

  async getDriveClient(): Promise<drive_v3.Drive> {
    const auth = await this.getAuthenticatedClient()
    return google.drive({ version: 'v3', auth })
  }

  async disconnect(): Promise<void> {
    const club = await prisma.club.findUnique({ where: { id: this.clubId } })
    if (!club || !club.driveAccessToken) return

    try {
      const oauth2Client = this.createOAuth2Client()
      const accessToken = decrypt(club.driveAccessToken)
      await oauth2Client.revokeToken(accessToken)
    } catch {
      // Continue even if revocation fails
    }

    await prisma.club.update({
      where: { id: this.clubId },
      data: {
        driveConnected: false,
        driveAccessToken: null,
        driveRefreshToken: null,
        driveTokenExpiry: null,
        webhookChannelId: null,
        webhookResourceId: null,
        webhookExpiry: null,
        drivePageToken: null,
      },
    })
  }
}
