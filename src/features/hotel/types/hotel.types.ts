import type { AuditMetadata } from '../../../types/audit';

export interface HotelEmail {
    label: string;
    address: string;
}

export interface HotelBankAccount extends AuditMetadata {
    id: number;
    hotelId: number;
    label: string;
    bankName?: string | null;
    accountNumber?: string | null;
    rib?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
    currency?: string | null;
    country?: string | null;
    isDefault: boolean;
    active: boolean;
}

export type HotelBankAccountPayload = Partial<Pick<HotelBankAccount, 'id'>> & {
    label: string;
    bankName?: string;
    accountNumber?: string;
    rib?: string;
    iban?: string;
    swiftCode?: string;
    currency?: string;
    country?: string;
    isDefault?: boolean;
    active?: boolean;
};

export interface Hotel extends AuditMetadata {
    id: number;
    reference?: string;
    name: string;
    logoUrl?: string;
    preferredThemeColor?: string;
    stars?: number;
    // Contact
    address: string;
    phone: string;
    fax?: string;
    emails?: HotelEmail[];
    // Légal
    legalRepresentative: string;
    fiscalName?: string;
    vatNumber?: string;
    // Bancaire
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    ibanCode?: string;
    bankAccounts?: HotelBankAccount[];
    // Opérationnel
    defaultCurrency: string;
}

export interface CreateHotelPayload {
    name: string;
    reference?: string;
    logoUrl?: string;
    preferredThemeColor?: string;
    stars?: number;
    // Contact
    address: string;
    phone: string;
    fax?: string;
    emails?: HotelEmail[];
    // Légal
    legalRepresentative: string;
    fiscalName?: string;
    vatNumber?: string;
    // Bancaire
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    ibanCode?: string;
    bankAccounts?: HotelBankAccountPayload[];
    // Opérationnel
    defaultCurrency: string;
}

export type UpdateHotelPayload = Partial<CreateHotelPayload>;
