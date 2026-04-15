import type { TFunction } from 'i18next';
import { z } from 'zod';

export function createExchangeRateSchema(t: TFunction) {
    const required = t('validation.required', { defaultValue: 'Required' });

    return z.object({
        fromCurrency: z.string().trim().length(3, t('validation.currencyCode', { defaultValue: 'Use a 3-letter currency code' })).transform((value) => value.toUpperCase()),
        toCurrency: z.string().trim().length(3, t('validation.currencyCode', { defaultValue: 'Use a 3-letter currency code' })).transform((value) => value.toUpperCase()),
        rate: z.coerce.number().positive(t('validation.positiveNumber', { defaultValue: 'Must be greater than zero' })),
        effectiveDate: z.string().trim().min(1, required),
        source: z.enum(['manual', 'system', 'imported']).default('manual'),
    }).refine((data) => data.fromCurrency !== data.toCurrency, {
        path: ['toCurrency'],
        message: t('validation.distinctCurrencies', { defaultValue: 'Choose two different currencies' }),
    });
}

export type ExchangeRateFormInput = z.input<ReturnType<typeof createExchangeRateSchema>>;
export type ExchangeRateFormValues = z.output<ReturnType<typeof createExchangeRateSchema>>;
