export type AffiliateType = 'TOUR_OPERATOR' | 'TRAVEL_AGENCY' | 'CORPORATE';

export interface AffiliateEmail {
    label: string;
    address: string;
}

export interface Affiliate {
    id: number;
    reference?: string;
    companyName: string;
    representativeName?: string;
    emails: AffiliateEmail[];
    affiliateType: AffiliateType;
    bankName?: string;
    iban?: string;
    swift?: string;
    address?: string;
    phone?: string;
    fax?: string;
}

export interface CreateAffiliatePayload {
    companyName: string;
    reference?: string;
    representativeName?: string;
    emails?: AffiliateEmail[];
    affiliateType: AffiliateType;
    bankName?: string;
    iban?: string;
    swift?: string;
    address?: string;
    phone?: string;
    fax?: string;
}

export type UpdateAffiliatePayload = Partial<CreateAffiliatePayload>;
