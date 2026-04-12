import type { TFunction } from 'i18next';
import { z } from 'zod';

export function createRoomTypeSchema(t: TFunction) {
    const required = t('validation.required', { defaultValue: 'Required' });
    const nonNegative = t('validation.nonNegative', { defaultValue: 'Must be zero or more' });

    return z.object({
        code: z.string().trim().min(1, required).max(4, t('validation.maxLength', { defaultValue: 'Too long' })),
        name: z.string().trim().min(1, required),
        minOccupancy: z.coerce.number().int().min(0, nonNegative),
        maxOccupancy: z.coerce.number().int().min(1, required),
        minAdults: z.coerce.number().int().min(0, nonNegative),
        maxAdults: z.coerce.number().int().min(0, nonNegative),
        minChildren: z.coerce.number().int().min(0, nonNegative),
        maxChildren: z.coerce.number().int().min(0, nonNegative),
        allowCotOverMax: z.boolean().default(false),
    })
        .refine((data) => data.maxOccupancy >= data.minOccupancy, {
            path: ['maxOccupancy'],
            message: t('validation.maxGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
        })
        .refine((data) => data.maxAdults >= data.minAdults, {
            path: ['maxAdults'],
            message: t('validation.maxGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
        })
        .refine((data) => data.maxChildren >= data.minChildren, {
            path: ['maxChildren'],
            message: t('validation.maxGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
        });
}

export type RoomTypeFormInput = z.input<ReturnType<typeof createRoomTypeSchema>>;
export type RoomTypeFormValues = z.output<ReturnType<typeof createRoomTypeSchema>>;
