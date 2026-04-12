import type { TFunction } from 'i18next';
import { z } from 'zod';
import { CancellationPenaltyType } from '../cancellation/types/cancellation.types';

const requiredName = (t: TFunction) =>
    z.string().trim().min(1, t('validation.nameRequired', { defaultValue: 'Name is required' }));

const nonNegativeNumber = (t: TFunction) =>
    z.number({ message: t('validation.numberRequired', { defaultValue: 'Enter a valid number' }) }).min(0, t('validation.nonNegative', { defaultValue: 'Value must be positive or zero' }));

const optionalText = z.string().trim().optional();

export const createCancellationTemplateSchema = (t: TFunction) =>
    z.object({
        name: requiredName(t),
        daysBeforeArrival: nonNegativeNumber(t),
        appliesToNoShow: z.boolean(),
        minStayCondition: nonNegativeNumber(t).nullable().optional(),
        penaltyType: z.nativeEnum(CancellationPenaltyType),
        baseValue: nonNegativeNumber(t),
    });

export type CancellationTemplateFormValues = z.infer<ReturnType<typeof createCancellationTemplateSchema>>;

export const createReductionTemplateSchema = (t: TFunction) =>
    z
        .object({
            name: requiredName(t),
            systemCode: z.enum(['EXTRA_ADULT', 'CHILD', 'CUSTOM']),
            calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FREE']),
            value: nonNegativeNumber(t).optional(),
            paxType: z.enum(['FIRST_CHILD', 'SECOND_CHILD', 'THIRD_CHILD', 'THIRD_ADULT']),
            paxOrder: nonNegativeNumber(t).nullable(),
            minAge: nonNegativeNumber(t),
            maxAge: nonNegativeNumber(t),
            applicationType: z.enum(['PER_NIGHT_PER_PERSON', 'PER_NIGHT_PER_ROOM', 'FLAT_RATE_PER_STAY']).optional(),
        })
        .refine((value) => value.maxAge >= value.minAge, {
            path: ['maxAge'],
            message: t('validation.maxMustBeGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
        });

export type ReductionTemplateFormValues = z.infer<ReturnType<typeof createReductionTemplateSchema>>;

export const createSupplementTemplateSchema = (t: TFunction) =>
    z
        .object({
            name: requiredName(t),
            systemCode: z.enum(['SINGLE_OCCUPANCY', 'GALA_DINNER', 'MEAL_PLAN', 'CUSTOM']),
            type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA', 'FREE']),
            value: nonNegativeNumber(t).optional(),
            formula: optionalText,
            isMandatory: z.boolean().optional(),
            applicationType: z.enum(['PER_NIGHT_PER_PERSON', 'PER_NIGHT_PER_ROOM', 'FLAT_RATE_PER_STAY']),
            minAge: nonNegativeNumber(t).nullable(),
            maxAge: nonNegativeNumber(t).nullable(),
            specificDate: z.string().nullable().optional(),
        })
        .superRefine((value, ctx) => {
            if (value.type === 'FORMULA' && !value.formula) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['formula'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }
            if (value.minAge !== null && value.maxAge !== null && value.maxAge < value.minAge) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['maxAge'],
                    message: t('validation.maxMustBeGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
                });
            }
        });

export type SupplementTemplateFormValues = z.infer<ReturnType<typeof createSupplementTemplateSchema>>;

export const createSpoTemplateSchema = (t: TFunction) =>
    z
        .object({
            name: requiredName(t),
            conditionType: z.enum(['MIN_NIGHTS', 'HONEYMOONER', 'EARLY_BIRD', 'LONG_STAY', 'NONE']),
            conditionValue: nonNegativeNumber(t).optional(),
            benefitType: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS', 'FREE_ROOM_UPGRADE', 'FREE_BOARD_UPGRADE', 'KIDS_GO_FREE']),
            benefitValue: nonNegativeNumber(t).optional(),
            value: nonNegativeNumber(t).optional(),
            applicationType: z.enum(['PER_NIGHT_PER_PERSON', 'PER_NIGHT_PER_ROOM', 'FLAT_RATE_PER_STAY']).optional(),
            stayNights: nonNegativeNumber(t).optional(),
            payNights: nonNegativeNumber(t).optional(),
        })
        .superRefine((value, ctx) => {
            if (['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(value.conditionType) && value.conditionValue === undefined) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['conditionValue'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }

            if (['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS'].includes(value.benefitType) && value.benefitValue === undefined) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['benefitValue'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }
        });

export type SpoTemplateFormValues = z.infer<ReturnType<typeof createSpoTemplateSchema>>;

export const createEarlyBookingTemplateSchema = (t: TFunction) =>
    z
        .object({
            name: requiredName(t),
            calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FREE']),
            value: nonNegativeNumber(t),
            applicationType: z.enum(['PER_NIGHT_PER_PERSON', 'PER_NIGHT_PER_ROOM', 'FLAT_RATE_PER_STAY']).optional(),
            releaseDays: nonNegativeNumber(t),
            bookingWindowStart: z.string().nullable().optional(),
            bookingWindowEnd: z.string().nullable().optional(),
            stayWindowStart: z.string().nullable().optional(),
            stayWindowEnd: z.string().nullable().optional(),
            isPrepaid: z.boolean(),
            prepaymentPercentage: nonNegativeNumber(t).nullable().optional(),
            prepaymentDeadlineDate: z.string().nullable().optional(),
            roomingListDeadlineDate: z.string().nullable().optional(),
        })
        .superRefine((value, ctx) => {
            if (value.bookingWindowStart && value.bookingWindowEnd && new Date(value.bookingWindowEnd) < new Date(value.bookingWindowStart)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['bookingWindowEnd'],
                    message: t('validation.endAfterStart', { defaultValue: 'End date must be after start date' }),
                });
            }

            if (value.stayWindowStart && value.stayWindowEnd && new Date(value.stayWindowEnd) < new Date(value.stayWindowStart)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['stayWindowEnd'],
                    message: t('validation.endAfterStart', { defaultValue: 'End date must be after start date' }),
                });
            }
        });

export type EarlyBookingTemplateFormValues = z.infer<ReturnType<typeof createEarlyBookingTemplateSchema>>;

export const createMonoparentalTemplateSchema = (t: TFunction) =>
    z
        .object({
            name: requiredName(t),
            adultCount: z.number().int().min(1, t('validation.required', { defaultValue: 'Required' })),
            childCount: z.number().int().min(1, t('validation.required', { defaultValue: 'Required' })),
            minAge: nonNegativeNumber(t),
            maxAge: nonNegativeNumber(t),
            baseRateType: z.enum(['SINGLE', 'DOUBLE']),
            childSurchargePercentage: nonNegativeNumber(t).max(200, t('validation.maxValue', { defaultValue: 'Value is too high' })),
            childSurchargeBase: z.enum(['SINGLE', 'DOUBLE', 'HALF_SINGLE', 'HALF_DOUBLE']),
        })
        .refine((value) => value.maxAge >= value.minAge, {
            path: ['maxAge'],
            message: t('validation.maxMustBeGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
        });

export type MonoparentalTemplateFormValues = z.infer<ReturnType<typeof createMonoparentalTemplateSchema>>;
