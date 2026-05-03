import { Request, Response, NextFunction } from 'express';
export interface AccessibleCategory {
    id: string;
    accessible: boolean;
}
declare global {
    namespace Express {
        interface Request {
            accessibleCategoryIds?: Set<string>;
        }
    }
}
export declare function loadAccessibleCategories(req: Request, _res: Response, next: NextFunction): Promise<void>;
export declare function checkCategoryAccess(categoryId: string, req: Request, res: Response): boolean;
//# sourceMappingURL=filterByAccess.d.ts.map