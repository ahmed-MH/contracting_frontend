import type { TFunction } from 'i18next';
import { z } from 'zod';
import { CancellationPenaltyType } from '../../../catalog/cancellation/types/cancellation.types';

type ExistingPeriod = { startDate: string; endDate: string; name: string };

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

const emptyToNullNumber = (t: TFunction) =>
    z.preprocess((value) => {
        if (value === '' || value === null || value === undefined) return null;
        if (typeof value === 'number' && Number.isNaN(value)) return null;
        return value;
    }, z.coerce.number({ message: t('validation.numberRequired', { defaultValue: 'Enter a valid number' }) }).min(0, t('validation.nonNegative', { defaultValue: 'Value must be positive or zero' })).nullable());

const requiredText = (t: TFunction) =>
    z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' }));

const nonNegativeNumber = (t: TFunction) =>
    z.number({ message: t('validation.numberRequired', { defaultValue: 'Enter a valid number' }) }).min(0, t('validation.nonNegative', { defaultValue: 'Value must be positive or zero' }));

const nonNegativeInteger = (t: TFunction) =>
    nonNegativeNumber(t).int(t('validation.integer', { defaultValue: 'Enter a whole number' }));

const applicationTypeSchema = z.enum(['PER_NIGHT_PER_PERSON', 'PER_NIGHT_PER_ROOM', 'FLAT_RATE_PER_STAY']);

const optionalDate = z.string().optional();

const validateDateOrder = (
    ctx: z.RefinementCtx,
    start: string | null | undefined,
    end: string | null | undefined,
    path: string[],
    t: TFunction,
) => {
    if (start && end && new Date(end) < new Date(start)) {
        ctx.addIssue({
            code: 'custom',
            path,
            message: t('validation.endAfterStart', { defaultValue: 'End date must be after start date' }),
        });
    }
};

export const createContractPeriodSchema = (
    t: TFunction,
    existingPeriods: ExistingPeriod[],
    contractStartDate: string,
    contractEndDate: string,
) =>
    z
        .object({
            name: requiredText(t),
            startDate: requiredText(t),
            endDate: requiredText(t),
        })
        .superRefine((value, ctx) => {
            const contractStart = contractStartDate?.substring(0, 10);
            const contractEnd = contractEndDate?.substring(0, 10);

            if (contractStart && value.startDate < contractStart) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['startDate'],
                    message: t('validation.dateBeforeContract', { defaultValue: 'Date is before contract start' }),
                });
            }

            if (contractEnd && value.endDate > contractEnd) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['endDate'],
                    message: t('validation.dateAfterContract', { defaultValue: 'Date is after contract end' }),
                });
            }

            if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['endDate'],
                    message: t('validation.endStrictlyAfterStart', { defaultValue: 'End date must be strictly after start date' }),
                });
            }

            for (const period of existingPeriods) {
                const overlapsStart = new Date(value.startDate).getTime() >= new Date(period.startDate).getTime()
                    && new Date(value.startDate).getTime() <= new Date(period.endDate).getTime();
                const overlapsEnd = new Date(value.endDate).getTime() >= new Date(period.startDate).getTime()
                    && new Date(value.endDate).getTime() <= new Date(period.endDate).getTime();

                if (overlapsStart) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['startDate'],
                        message: t('validation.periodOverlap', {
                            defaultValue: 'This date is already used by {{name}}',
                            name: period.name,
                        }),
                    });
                }

                if (overlapsEnd) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['endDate'],
                        message: t('validation.periodOverlap', {
                            defaultValue: 'This date is already used by {{name}}',
                            name: period.name,
                        }),
                    });
                }
            }
        });

export type ContractPeriodFormValues = z.infer<ReturnType<typeof createContractPeriodSchema>>;

export const createContractGeneralSchema = (t: TFunction) =>
    z
        .object({
            name: requiredText(t),
            startDate: requiredText(t),
            endDate: requiredText(t),
            currency: z.string().trim().min(1, t('validation.required', { defaultValue: 'Required' })).length(3).transform((value) => value.toUpperCase()),
            affiliateIds: idArraySchema,
            baseArrangementId: optionalIdSchema,
            paymentCondition: z.enum(['DEPOSIT', 'PREPAYMENT_100']),
            depositAmount: nonNegativeNumber(t),
            creditDays: nonNegativeInteger(t),
            paymentMethods: z.array(z.enum(['BANK_TRANSFER', 'BANK_CHECK'])),
        })
        .superRefine((value, ctx) => {
            if (value.affiliateIds.length === 0) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['affiliateIds'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }

            if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['endDate'],
                    message: t('validation.endAfterStart', { defaultValue: 'End date must be after start date' }),
                });
            }
        });

export type ContractGeneralFormInput = z.input<ReturnType<typeof createContractGeneralSchema>>;
export type ContractGeneralFormValues = z.infer<ReturnType<typeof createContractGeneralSchema>>;

export const createContractCancellationSchema = (t: TFunction) =>
    z.object({
        name: requiredText(t),
        daysBeforeArrival: nonNegativeInteger(t),
        appliesToNoShow: z.boolean(),
        minStayCondition: emptyToNullNumber(t),
        penaltyType: z.nativeEnum(CancellationPenaltyType),
        baseValue: nonNegativeNumber(t),
        contractRoomIds: idArraySchema,
        periodIds: idArraySchema.optional(),
    });

export type ContractCancellationFormInput = z.input<ReturnType<typeof createContractCancellationSchema>>;
export type ContractCancellationFormValues = z.infer<ReturnType<typeof createContractCancellationSchema>>;

export const createContractSupplementSchema = (t: TFunction) =>
    z
        .object({
            name: requiredText(t),
            systemCode: z.enum(['SINGLE_OCCUPANCY', 'GALA_DINNER', 'MEAL_PLAN', 'CUSTOM']),
            type: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA', 'FREE']),
            value: nonNegativeNumber(t),
            formula: z.string().trim(),
            isMandatory: z.boolean(),
            applicationType: applicationTypeSchema,
            applicableContractRoomIds: idArraySchema,
            specificDate: optionalDate,
            minAge: nonNegativeNumber(t),
            maxAge: nonNegativeNumber(t),
            targetArrangementId: optionalIdSchema,
        })
        .superRefine((value, ctx) => {
            if (value.type === 'FORMULA' && !value.formula) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['formula'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }

            if (value.maxAge < value.minAge) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['maxAge'],
                    message: t('validation.maxMustBeGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
                });
            }

            if (value.systemCode === 'MEAL_PLAN' && !value.targetArrangementId) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['targetArrangementId'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }
        });

export type ContractSupplementFormInput = z.input<ReturnType<typeof createContractSupplementSchema>>;
export type ContractSupplementFormValues = z.infer<ReturnType<typeof createContractSupplementSchema>>;

export const createContractReductionSchema = (t: TFunction) =>
    z
        .object({
            name: requiredText(t),
            systemCode: z.enum(['EXTRA_ADULT', 'CHILD', 'CUSTOM']),
            calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FREE']),
            value: nonNegativeNumber(t),
            paxType: z.enum(['FIRST_CHILD', 'SECOND_CHILD', 'THIRD_CHILD', 'THIRD_ADULT']),
            paxOrder: z.number().nullable(),
            minAge: nonNegativeNumber(t),
            maxAge: nonNegativeNumber(t),
            applicableContractRoomIds: idArraySchema,
            applicationType: applicationTypeSchema,
        })
        .superRefine((value, ctx) => {
            if (value.systemCode !== 'CUSTOM' && (value.paxOrder === null || value.paxOrder < (value.systemCode === 'EXTRA_ADULT' ? 3 : 1))) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['paxOrder'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }

            if (value.maxAge < value.minAge) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['maxAge'],
                    message: t('validation.maxMustBeGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
                });
            }
        });

export type ContractReductionFormInput = z.input<ReturnType<typeof createContractReductionSchema>>;
export type ContractReductionFormValues = z.infer<ReturnType<typeof createContractReductionSchema>>;

export const createContractEarlyBookingSchema = (t: TFunction) =>
    z
        .object({
            name: requiredText(t),
            calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FREE']),
            value: nonNegativeNumber(t),
            releaseDays: nonNegativeInteger(t),
            bookingWindowStart: optionalDate,
            bookingWindowEnd: optionalDate,
            stayWindowStart: optionalDate,
            stayWindowEnd: optionalDate,
            isPrepaid: z.boolean(),
            prepaymentPercentage: emptyToNullNumber(t),
            prepaymentDeadlineDate: optionalDate,
            roomingListDeadlineDate: optionalDate,
            applicableContractRoomIds: idArraySchema,
            applicationType: applicationTypeSchema,
        })
        .superRefine((value, ctx) => {
            validateDateOrder(ctx, value.bookingWindowStart, value.bookingWindowEnd, ['bookingWindowEnd'], t);
            validateDateOrder(ctx, value.stayWindowStart, value.stayWindowEnd, ['stayWindowEnd'], t);

            if (value.isPrepaid && value.prepaymentPercentage !== null && value.prepaymentPercentage > 100) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['prepaymentPercentage'],
                    message: t('validation.maxValue', { defaultValue: 'Value is too high' }),
                });
            }
        });

export type ContractEarlyBookingFormInput = z.input<ReturnType<typeof createContractEarlyBookingSchema>>;
export type ContractEarlyBookingFormValues = z.infer<ReturnType<typeof createContractEarlyBookingSchema>>;

export const createContractMonoparentalSchema = (t: TFunction) =>
    z
        .object({
            name: requiredText(t),
            adultCount: z.number().int().min(1, t('validation.required', { defaultValue: 'Required' })),
            childCount: z.number().int().min(1, t('validation.required', { defaultValue: 'Required' })),
            childSurchargePercentage: nonNegativeNumber(t).max(200, t('validation.maxValue', { defaultValue: 'Value is too high' })),
            minAge: nonNegativeNumber(t),
            maxAge: nonNegativeNumber(t),
            baseRateType: z.enum(['SINGLE', 'DOUBLE']),
            childSurchargeBase: z.enum(['SINGLE', 'DOUBLE', 'HALF_SINGLE', 'HALF_DOUBLE']),
            applicableContractRoomIds: idArraySchema,
        })
        .refine((value) => value.maxAge >= value.minAge, {
            path: ['maxAge'],
            message: t('validation.maxMustBeGreaterThanMin', { defaultValue: 'Maximum must be greater than minimum' }),
        });

export type ContractMonoparentalFormInput = z.input<ReturnType<typeof createContractMonoparentalSchema>>;
export type ContractMonoparentalFormValues = z.infer<ReturnType<typeof createContractMonoparentalSchema>>;

export const createContractSpoSchema = (t: TFunction) =>
    z
        .object({
            name: requiredText(t),
            conditionType: z.enum(['MIN_NIGHTS', 'HONEYMOONER', 'EARLY_BIRD', 'LONG_STAY', 'NONE']),
            conditionValue: emptyToNullNumber(t),
            benefitType: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS', 'FREE_ROOM_UPGRADE', 'FREE_BOARD_UPGRADE', 'KIDS_GO_FREE']),
            benefitValue: emptyToNullNumber(t).optional(),
            value: nonNegativeNumber(t).optional(),
            applicationType: applicationTypeSchema.optional(),
            stayNights: nonNegativeNumber(t).optional(),
            payNights: nonNegativeNumber(t).optional(),
            periodIds: idArraySchema.optional(),
            contractRoomIds: idArraySchema,
            arrangementIds: idArraySchema,
        })
        .superRefine((value, ctx) => {
            if (['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(value.conditionType) && value.conditionValue === null) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['conditionValue'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }

            if (['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(value.benefitType) && value.value === undefined) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['value'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }

            if (value.benefitType === 'FREE_NIGHTS' && (value.stayNights === undefined || value.payNights === undefined)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['stayNights'],
                    message: t('validation.required', { defaultValue: 'Required' }),
                });
            }
        });

export type ContractSpoFormInput = z.input<ReturnType<typeof createContractSpoSchema>>;
export type ContractSpoFormValues = z.infer<ReturnType<typeof createContractSpoSchema>>;
