import type { TFunction } from 'i18next';
import { z } from 'zod';

const roleSchema = z.enum(['ADMIN', 'COMMERCIAL']);

const hotelIdsSchema = z
    .array(z.union([z.number(), z.string()]))
    .transform((ids) => ids.map(Number).filter((id) => Number.isFinite(id) && id > 0));

const validateHotelAssignment = (t: TFunction) => (value: { role: 'ADMIN' | 'COMMERCIAL'; hotelIds: number[] }, ctx: z.RefinementCtx) => {
    if (value.role === 'COMMERCIAL' && value.hotelIds.length === 0) {
        ctx.addIssue({
            code: 'custom',
            path: ['hotelIds'],
            message: t('pages.users.modals.invite.validation.hotelRequired', {
                defaultValue: 'At least one hotel is required',
            }),
        });
    }
};

export const createInviteUserSchema = (t: TFunction) =>
    z
        .object({
            email: z
                .string()
                .trim()
                .min(1, t('pages.users.modals.invite.validation.emailRequired', { defaultValue: 'Email is required' }))
                .email(t('validation.emailInvalid', { defaultValue: 'Enter a valid email address' })),
            role: roleSchema,
            hotelIds: hotelIdsSchema,
        })
        .superRefine(validateHotelAssignment(t));

export type InviteUserFormValues = z.infer<ReturnType<typeof createInviteUserSchema>>;
export type InviteUserFormInput = z.input<ReturnType<typeof createInviteUserSchema>>;

export const createEditUserSchema = (t: TFunction) =>
    z
        .object({
            firstName: z.string().trim(),
            lastName: z.string().trim(),
            role: roleSchema,
            hotelIds: hotelIdsSchema,
        })
        .superRefine(validateHotelAssignment(t));

export type EditUserFormValues = z.infer<ReturnType<typeof createEditUserSchema>>;
export type EditUserFormInput = z.input<ReturnType<typeof createEditUserSchema>>;
