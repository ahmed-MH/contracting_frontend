export interface Arrangement {
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
