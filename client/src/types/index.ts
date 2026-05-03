// Shared TypeScript interfaces matching API responses

export type Role = 'ADMIN' | 'MOD' | 'MEMBER';

export type PlacementStatus = 'PLACED' | 'PENDING' | 'FAILED' | 'UNSORTED';

export interface Club {
  id: string;
  name: string;
  clubType: string | null;
  driveConnected: boolean;
  setupStep: number;
  demoMode: boolean;
  lastSyncAt: string | null;
  driftUnresolvedCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  clubId: string;
  club: Club;
  darkMode: boolean;
  firstLoginComplete: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  clubId: string;
  name: string;
  parentId: string | null;
  driveFolderId: string | null;
  description: string | null;
  minimumRole: Role;
  sortOrder: number;
  lastUpdatedAt: string;
  children?: Category[];
  files?: FileMeta[];
  ancestors?: CategoryAncestor[];
  isNew?: boolean;
}

export interface CategoryAncestor {
  id: string;
  name: string;
}

export interface FileMeta {
  id: string;
  clubId: string;
  categoryId: string | null;
  driveFileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string | null;
  uploader?: { id: string; displayName: string } | null;
  placementStatus: PlacementStatus;
  confidenceScore: number | null;
  routingExplanation: string | null;
  aiSummary: string | null;
  uploadNote: string | null;
  isUnmanaged: boolean;
  driveLastModified: string | null;
  uploadedAt: string;
  tags?: Tag[];
  isNew?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  fileId: string;
  autoGen: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  resourceId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  user?: { displayName: string } | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ArchitectureVersion {
  id: string;
  version: number;
  isActive: boolean;
  isDraft: boolean;
  activatedAt: string | null;
  createdAt: string;
  treeSnapshot: unknown;
}

export interface ArchitectureProposal {
  id: string;
  type: 'PRESERVE' | 'REORGANIZE' | 'FRESH';
  rationale: string;
  tree: Category[];
}

export interface RoutingResult {
  fileId: string;
  fileName: string;
  autoPlaced: boolean;
  categoryId: string | null;
  categoryName: string | null;
  confidenceScore: number | null;
  explanation: string | null;
  alternatives: Array<{
    categoryId: string;
    categoryName: string;
    score: number;
    explanation: string;
  }>;
  renameSuggestion: string | null;
  duplicateWarning: {
    existingFileId: string;
    existingFileName: string;
  } | null;
  newCategorySuggestion: {
    name: string;
    parentId: string | null;
    rationale: string;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SetupStatus {
  currentStep: number;
  steps: Array<{
    step: number;
    label: string;
    completed: boolean;
    unlocked: boolean;
  }>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
