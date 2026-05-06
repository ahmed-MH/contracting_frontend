import type { TFunction } from 'i18next';
import { z } from 'zod';

const optionalText = z.string().trim().optional().transform((value) => value || undefined);

export function createAffiliateEmailSpoSchema(t: TFunction) {
    const required = t('validation.required', { defaultValue: 'Required' });

    return z.object({
        name: z.string().trim().min(1, required),
        description: optionalText,
        discountPercent: z.coerce.number().gt(0, t('validation.mustBeGreaterThanZero', { defaultValue: 'Must be greater than zero' })).max(100, t('validation.maxPercent', { defaultValue: 'Must be 100 or less' })),
        applicationFrom: z.string().min(1, required),
        applicationTo: z.string().min(1, required),
        stackMode: z.enum(['ROLLING', 'CUMULATIVE']),
        applicationStep: z.enum([
            'AFTER_BASE_RATE',
            'AFTER_BOARD_SUPPLEMENT',
            'AFTER_SUPPLEMENT',
            'AFTER_REDUCTION',
            'AFTER_MONOPARENTAL',
            'AFTER_EARLY_BOOKING',
            'AFTER_CONTRACT_SPO',
        ]),
        status: z.enum(['ACTIVE', 'INACTIVE']),
    }).refine((values) => values.applicationFrom <= values.applicationTo, {
        message: t('validation.invalidDateRange', { defaultValue: 'Application from must be before or equal to application to' }),
        path: ['applicationTo'],
    });
}

export type AffiliateEmailSpoFormInput = z.input<ReturnType<typeof createAffiliateEmailSpoSchema>>;
export type AffiliateEmailSpoFormValues = z.output<ReturnType<typeof createAffiliateEmailSpoSchema>>;
