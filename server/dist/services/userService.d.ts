import { Role } from '@prisma/client';
export declare class UserService {
    listUsers(clubId: string): Promise<{
        email: string;
        id: string;
        displayName: string;
        role: import(".prisma/client").$Enums.Role;
        lastLoginAt: Date | null;
        createdAt: Date;
    }[]>;
    createInvitation(clubId: string, email: string, role: Role, inviterId: string): Promise<{
        token: `${string}-${string}-${string}-${string}-${string}`;
        expiresAt: Date;
    }>;
    validateInvitation(token: string): Promise<{
        readonly valid: false;
        readonly error: "Invitation not found";
        readonly invitation?: undefined;
        readonly clubName?: undefined;
    } | {
        readonly valid: false;
        readonly error: "Invitation already used";
        readonly invitation?: undefined;
        readonly clubName?: undefined;
    } | {
        readonly valid: false;
        readonly error: "Invitation expired";
        readonly invitation?: undefined;
        readonly clubName?: undefined;
    } | {
        readonly valid: true;
        readonly invitation: {
            email: string;
            id: string;
            role: import(".prisma/client").$Enums.Role;
            clubId: string;
            createdAt: Date;
            token: string;
            expiresAt: Date;
            usedAt: Date | null;
        };
        readonly clubName: string;
        readonly error?: undefined;
    }>;
    acceptInvitation(token: string, userId: string): Promise<void>;
    changeRole(clubId: string, targetUserId: string, newRole: Role, actorId: string): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        passwordHash: string | null;
        displayName: string;
        role: import(".prisma/client").$Enums.Role;
        clubId: string;
        darkMode: boolean;
        firstLoginComplete: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeUser(clubId: string, targetUserId: string, actorId: string): Promise<void>;
    setCategoryMinimumRole(clubId: string, categoryId: string, minimumRole: Role): Promise<{
        id: string;
        clubId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        parentId: string | null;
        driveFolderId: string | null;
        description: string | null;
        minimumRole: import(".prisma/client").$Enums.Role;
        sortOrder: number;
        lastUpdatedAt: Date;
    }>;
    grantAccess(categoryId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        categoryId: string;
        userId: string;
    }>;
    revokeAccess(categoryId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    submitAccessRequest(userId: string, categoryId: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        categoryId: string;
        userId: string;
        resolvedBy: string | null;
        resolvedAt: Date | null;
    }>;
    resolveAccessRequest(requestId: string, status: 'APPROVED' | 'DENIED', resolvedBy: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        categoryId: string;
        userId: string;
        resolvedBy: string | null;
        resolvedAt: Date | null;
    }>;
    private ensureLastAdminSafe;
}
export declare const userService: UserService;
//# sourceMappingURL=userService.d.ts.map