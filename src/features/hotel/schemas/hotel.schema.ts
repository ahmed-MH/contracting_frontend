import type { TFunction } from 'i18next';
import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined);

const emailEntrySchema = (t: TFunction) =>
    z.object({
        label: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        address: z
            .string()
            .trim()
            .min(1, t('validation.required', { defaultValue: 'Required' }))
            .email(t('validation.emailInvalid', { defaultValue: 'Enter a valid email address' })),
    });

export const createHotelSchema = (t: TFunction) =>
    z.object({
        name: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        address: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        phone: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        fax: optionalText,
        legalRepresentative: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        fiscalName: optionalText,
        vatNumber: optionalText,
        bankName: optionalText,
        accountNumber: optionalText,
        swiftCode: optionalText,
        ibanCode: optionalText,
        defaultCurrency: z
            .string()
            .trim()
            .min(1, t('validation.required', { defaultValue: 'Required' }))
            .length(3, t('pages.hotel.validation.currencyLength', { defaultValue: 'Use a 3-letter currency code' }))
            .transform((value) => value.toUpperCase()),
        logoUrl: optionalText,
        stars: z.union([z.number(), z.nan(), z.undefined()]).optional().transform((value) => (Number.isFinite(value) ? value : undefined)),
        emails: z.array(emailEntrySchema(t)).optional().default([]),
    });

export type HotelFormInput = z.input<ReturnType<typeof createHotelSchema>>;
export type HotelFormValues = z.infer<ReturnType<typeof createHotelSchema>>;
