import type { TFunction } from 'i18next';
import { z } from 'zod';

const optionalText = z.string().trim().optional().transform((value) => value || undefined);

export function createArrangementSchema(t: TFunction) {
    const required = t('validation.required', { defaultValue: 'Required' });

    return z.object({
        code: z.string().trim().min(1, required).max(5, t('validation.maxLength', { defaultValue: 'Too long' })),
        name: z.string().trim().min(1, required),
        reference: optionalText,
        description: optionalText,
        level: z.coerce.number().int().min(0, t('validation.nonNegative', { defaultValue: 'Must be zero or more' })).default(0),
    });
}

export type ArrangementFormInput = z.input<ReturnType<typeof createArrangementSchema>>;
export type ArrangementFormValues = z.output<ReturnType<typeof createArrangementSchema>>;
