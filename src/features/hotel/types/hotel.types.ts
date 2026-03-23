export interface HotelEmail {
    label: string;
    address: string;
}

export interface Hotel {
    id: number;
    reference?: string;
    name: string;
    logoUrl?: string;
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
    // Opérationnel
    defaultCurrency: string;
}

export interface CreateHotelPayload {
    name: string;
    reference?: string;
    logoUrl?: string;
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
    // Opérationnel
    defaultCurrency: string;
}

export type UpdateHotelPayload = Partial<CreateHotelPayload>;
