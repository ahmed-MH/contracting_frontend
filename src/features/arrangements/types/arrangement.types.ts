import type { AuditMetadata } from '../../../types/audit';

export interface Arrangement extends AuditMetadata {
    id: number;
    reference?: string;
    code: string;
    name: string;
    description?: string;
    level: number;
}

export interface CreateArrangementPayload {
    code: string;
    name: string;
    reference?: string;
    description?: string;
    level?: number;
}

export type UpdateArrangementPayload = Partial<CreateArrangementPayload>;
