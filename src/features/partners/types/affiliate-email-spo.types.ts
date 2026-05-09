import type { AuditMetadata } from '../../../types/audit';

export type AffiliateEmailSpoStackMode = 'ROLLING' | 'CUMULATIVE';

export type AffiliateEmailSpoApplicationStep =
    | 'AFTER_BASE_RATE'
    | 'AFTER_BOARD_SUPPLEMENT'
    | 'AFTER_SUPPLEMENT'
    | 'AFTER_REDUCTION'
    | 'AFTER_MONOPARENTAL'
    | 'AFTER_EARLY_BOOKING'
    | 'AFTER_CONTRACT_SPO';

export type AffiliateEmailSpoStatus = 'ACTIVE' | 'INACTIVE';

export interface AffiliateEmailSpo extends AuditMetadata {
    id: number;
    hotelId: number;
    affiliateId: number;
    name: string;
    description?: string | null;
    discountPercent: number;
    applicationFrom: string;
    applicationTo: string;
    stackMode: AffiliateEmailSpoStackMode;
    applicationStep: AffiliateEmailSpoApplicationStep;
    status: AffiliateEmailSpoStatus;
}

export interface CreateAffiliateEmailSpoPayload {
    name: string;
    description?: string;
    discountPercent: number;
    applicationFrom: string;
    applicationTo: string;
    stackMode?: AffiliateEmailSpoStackMode;
    applicationStep?: AffiliateEmailSpoApplicationStep;
    status?: AffiliateEmailSpoStatus;
}

export type UpdateAffiliateEmailSpoPayload = Partial<CreateAffiliateEmailSpoPayload>;

export interface BulkCreateAffiliateEmailSpoPayload extends CreateAffiliateEmailSpoPayload {
    affiliateIds: number[];
}

export interface BulkCreateAffiliateEmailSpoResult {
    created: AffiliateEmailSpo[];
    skipped: {
        affiliateId: number;
        affiliateName?: string;
        reason: string;
    }[];
}
