import { drive_v3, Auth } from 'googleapis';
export declare class DriveConnector {
    private clubId;
    constructor(clubId: string);
    private createOAuth2Client;
    generateAuthUrl(): string;
    exchangeCodeForTokens(code: string): Promise<void>;
    getAuthenticatedClient(): Promise<Auth.OAuth2Client>;
    getDriveClient(): Promise<drive_v3.Drive>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=driveConnector.d.ts.map