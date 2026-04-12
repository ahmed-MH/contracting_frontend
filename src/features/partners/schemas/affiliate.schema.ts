import type { TFunction } from 'i18next';
import { z } from 'zod';

const optionalText = z.string().trim().optional().transform((value) => value || undefined);

export function createAffiliateSchema(t: TFunction) {
    const required = t('validation.required', { defaultValue: 'Required' });

    return z.object({
        companyName: z.string().trim().min(1, required),
        reference: optionalText,
        representativeName: optionalText,
        affiliateType: z.enum(['TOUR_OPERATOR', 'TRAVEL_AGENCY', 'CORPORATE']),
        emails: z.array(z.object({
            label: z.string().trim().min(1, required),
            address: z.string().trim().email(t('validation.email', { defaultValue: 'Enter a valid email address' })),
        })).min(1, t('validation.atLeastOneEmail', { defaultValue: 'Add at least one email' })),
        bankName: optionalText,
        iban: optionalText,
        swift: optionalText,
        address: optionalText,
        phone: optionalText,
        fax: optionalText,
    });
}

export type AffiliateFormInput = z.input<ReturnType<typeof createAffiliateSchema>>;
export type AffiliateFormValues = z.output<ReturnType<typeof createAffiliateSchema>>;
