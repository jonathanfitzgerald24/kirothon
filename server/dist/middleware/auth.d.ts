import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (minimumRole: Role) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map