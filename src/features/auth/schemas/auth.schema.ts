import type { TFunction } from 'i18next';
import { z } from 'zod';

const emailSchema = (t: TFunction) =>
    z
        .string()
        .trim()
        .min(1, t('auth:validation.emailRequired'))
        .email(t('auth:validation.emailInvalid'));

const passwordSchema = (t: TFunction) =>
    z
        .string()
        .min(1, t('auth:validation.passwordRequired'))
        .min(6, t('auth:validation.passwordMinLength'));

const requiredText = (t: TFunction) =>
    z.string().trim().min(1, t('auth:validation.required'));

export const createLoginSchema = (t: TFunction) =>
    z.object({
        email: emailSchema(t),
        password: z.string().min(1, t('auth:validation.passwordRequired')),
    });

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export const createForgotPasswordSchema = (t: TFunction) =>
    z.object({
        email: emailSchema(t),
    });

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export const createAcceptInviteSchema = (t: TFunction) =>
    z
        .object({
            firstName: requiredText(t),
            lastName: requiredText(t),
            password: passwordSchema(t),
            confirmPassword: z.string().min(1, t('auth:validation.confirmationRequired')),
        })
        .refine((value) => value.password === value.confirmPassword, {
            path: ['confirmPassword'],
            message: t('auth:validation.passwordMismatch'),
        });

export type AcceptInviteFormValues = z.infer<ReturnType<typeof createAcceptInviteSchema>>;

export const createResetPasswordSchema = (t: TFunction) =>
    z
        .object({
            newPassword: passwordSchema(t),
            confirmPassword: z.string().min(1, t('auth:validation.confirmationRequired')),
        })
        .refine((value) => value.newPassword === value.confirmPassword, {
            path: ['confirmPassword'],
            message: t('auth:validation.passwordMismatch'),
        });

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;
