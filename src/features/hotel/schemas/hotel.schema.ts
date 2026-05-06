import type { TFunction } from 'i18next';
import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal('')).transform((value) => value || undefined);
const optionalHexColor = (t: TFunction) =>
    z.string()
        .trim()
        .optional()
        .or(z.literal(''))
        .transform((value) => value || undefined)
        .refine((value) => !value || /^#[0-9A-Fa-f]{6}$/.test(value), {
            message: t('pages.hotel.validation.themeColor', { defaultValue: 'Use a hex color like #0D9488' }),
        });

const emailEntrySchema = (t: TFunction) =>
    z.object({
        label: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        address: z
            .string()
            .trim()
            .min(1, t('validation.required', { defaultValue: 'Required' }))
            .email(t('validation.emailInvalid', { defaultValue: 'Enter a valid email address' })),
    });

const bankAccountSchema = (t: TFunction) =>
    z.object({
        id: z.number().optional(),
        label: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })),
        bankName: optionalText,
        accountNumber: optionalText,
        rib: optionalText,
        iban: optionalText,
        swiftCode: optionalText.transform((value) => value?.toUpperCase()),
        currency: optionalText.transform((value) => value?.toUpperCase()),
        country: optionalText.transform((value) => value?.toUpperCase()),
        isDefault: z.boolean().optional().default(false),
        active: z.boolean().optional().default(true),
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
        preferredThemeColor: optionalHexColor(t),
        stars: z.union([z.number(), z.nan(), z.undefined()]).optional().transform((value) => (Number.isFinite(value) ? value : undefined)),
        emails: z.array(emailEntrySchema(t)).optional().default([]),
        bankAccounts: z.array(bankAccountSchema(t)).optional().default([]),
    }).superRefine((value, ctx) => {
        const activeAccounts = value.bankAccounts.filter((account) => account.active !== false);
        const principalAccounts = activeAccounts.filter((account) => account.isDefault);

        if (activeAccounts.length > 0 && principalAccounts.length !== 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['bankAccounts'],
                message: t('pages.hotel.validation.onePrincipalBankAccount', {
                    defaultValue: 'Choose exactly one principal bank account.',
                }),
            });
        }
    });

export type HotelFormInput = z.input<ReturnType<typeof createHotelSchema>>;
export type HotelFormValues = z.infer<ReturnType<typeof createHotelSchema>>;
