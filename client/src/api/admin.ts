import type {
  User,
  Role,
  ArchitectureVersion,
  ArchitectureProposal,
  Category,
  AuditLogEntry,
  PaginatedResponse,
  SetupStatus,
} from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from './client';

export const adminApi = {
  // Users
  getUsers: () => apiGet<User[]>('/users'),
  inviteUser: (email: string, role: Role) => apiPost<void>('/users/invite', { email, role }),
  changeRole: (userId: string, role: Role) => apiPut<void>(`/users/${userId}/role`, { role }),
  removeUser: (userId: string) => apiDelete<void>(`/users/${userId}`),

  // Architecture
  getProposals: () => apiGet<ArchitectureProposal[]>('/architecture/proposals'),
  selectProposal: (proposalId: string) => apiPost<void>('/architecture/select', { proposalId }),
  updateDraft: (tree: unknown) => apiPut<Category[]>('/architecture/draft', { tree }),
  getDraftPreview: () => apiGet<Category[]>('/architecture/draft/preview'),
  activateArchitecture: (confirm?: boolean) => apiPost<void>('/architecture/activate', { confirm }),
  getCurrentArchitecture: () => apiGet<Category[]>('/architecture/current'),
  getVersions: () => apiGet<ArchitectureVersion[]>('/architecture/versions'),
  rollback: (versionId: string) => apiPost<void>(`/architecture/rollback/${versionId}`),

  // Category access
  setCategoryMinRole: (categoryId: string, minimumRole: Role) =>
    apiPut<void>(`/categories/${categoryId}/minimum-role`, { minimumRole }),
  grantAccess: (categoryId: string, userId: string) =>
    apiPost<void>(`/categories/${categoryId}/access`, { userId }),
  revokeAccess: (categoryId: string, userId: string) =>
    apiDelete<void>(`/categories/${categoryId}/access/${userId}`),

  // Audit logs
  getAuditLogs: (params?: { action?: string; userId?: string; from?: string; to?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const qs = searchParams.toString();
    return apiGet<PaginatedResponse<AuditLogEntry>>(`/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // Drive
  getDriveStatus: () => apiGet<{ connected: boolean; lastSyncAt: string | null; driftCount: number }>('/drive/status'),
  connectDriveUrl: () => `/api/v1/drive/connect`,
  disconnectDrive: () => apiPost<void>('/drive/disconnect'),
  getDriftItems: () => apiGet<Array<{ id: string; changeType: string; drivePath: string; createdAt: string }>>('/drive/drift'),
  resolveDrift: (id: string, resolution: 'ACCEPTED' | 'IGNORED') => apiPut<void>(`/drive/drift/${id}`, { resolution }),

  // Setup
  getSetupStatus: () => apiGet<SetupStatus>('/setup/status'),
  setClubType: (clubType: string) => apiPut<void>('/setup/club-type', { clubType }),

  // AI
  triggerAnalysis: () => apiPost<{ jobId: string }>('/structure/analyze'),
  getAnalysisStatus: (jobId: string) => apiGet<{ status: string; result?: unknown }>(`/structure/analyze/${jobId}`),
  generateProposals: () => apiPost<void>('/architecture/propose'),
};
