import type { TFunction } from 'i18next';
import { z } from 'zod';

const optionalDate = z.string().nullable().optional().transform((value) => value || null);

export function createExchangeRateSchema(t: TFunction) {
    const required = t('validation.required', { defaultValue: 'Required' });

    return z.object({
        currency: z.string().trim().min(1, required),
        rate: z.coerce.number().positive(t('validation.positiveNumber', { defaultValue: 'Must be greater than zero' })),
        validFrom: z.string().trim().min(1, required),
        validUntil: optionalDate,
    }).refine((data) => !data.validUntil || data.validUntil >= data.validFrom, {
        path: ['validUntil'],
        message: t('validation.endAfterStart', { defaultValue: 'End date must be after start date' }),
    });
}

export type ExchangeRateFormInput = z.input<ReturnType<typeof createExchangeRateSchema>>;
export type ExchangeRateFormValues = z.output<ReturnType<typeof createExchangeRateSchema>>;
