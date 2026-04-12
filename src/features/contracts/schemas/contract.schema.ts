import type { TFunction } from 'i18next';
import { z } from 'zod';

const idArraySchema = z
    .array(z.union([z.number(), z.string()]))
    .transform((ids) => ids.map(Number).filter((id) => Number.isFinite(id) && id > 0));

const optionalIdSchema = z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
        if (value === null || value === undefined || value === '') return null;
        const id = Number(value);
        return Number.isFinite(id) && id > 0 ? id : null;
    });

export const createContractSchema = (t: TFunction) =>
    z
        .object({
            name: z
                .string()
                .trim()
                .min(1, t('pages.contracts.modal.validation.nameRequired', { defaultValue: 'Contract name is required' })),
            startDate: z.string().min(1, t('validation.required', { defaultValue: 'Required' })),
            endDate: z.string().min(1, t('validation.required', { defaultValue: 'Required' })),
            currency: z
                .string()
                .trim()
                .min(1, t('validation.required', { defaultValue: 'Required' }))
                .length(3, t('pages.contracts.modal.validation.currencyLength', { defaultValue: 'Use a 3-letter currency code' }))
                .transform((value) => value.toUpperCase()),
            affiliateIds: idArraySchema,
            baseArrangementId: optionalIdSchema,
        })
        .superRefine((value, ctx) => {
            if (value.affiliateIds.length === 0) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['affiliateIds'],
                    message: t('pages.contracts.modal.validation.partnerRequired', { defaultValue: 'Select at least one partner' }),
                });
            }

            if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['endDate'],
                    message: t('pages.contracts.modal.validation.endAfterStart', { defaultValue: 'End date must be after start date' }),
                });
            }
        });

export type CreateContractFormInput = z.input<ReturnType<typeof createContractSchema>>;
export type CreateContractFormValues = z.infer<ReturnType<typeof createContractSchema>>;
