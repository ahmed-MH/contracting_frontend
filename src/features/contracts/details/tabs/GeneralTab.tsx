import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateContract } from '../../hooks/useContracts';
import { useAffiliates } from '../../../partners/hooks/useAffiliates';
import { useArrangements } from '../../../arrangements/hooks/useArrangements';
import { useHotel } from '../../../hotel/context/HotelContext';
import { Banknote, FileText, Landmark, Save, WalletCards } from 'lucide-react';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import type { ContractMarketScope, ContractPaymentPolicy, PaymentConditionBasis, PaymentConditionType, PaymentDueTrigger, PaymentMethodType } from '../../types/contract.types';
import { ContractSectionShell } from '../components/ContractSection';
import {
    createContractGeneralSchema,
    type ContractGeneralFormInput,
    type ContractGeneralFormValues,
} from '../schemas/contract-detail.schema';

function toInputDate(iso: string): string {
    return iso ? iso.substring(0, 10) : '';
}

const PAYMENT_METHODS: PaymentMethodType[] = [
    'BANK_TRANSFER',
    'SWIFT_TRANSFER',
    'BANK_CHECK',
    'BANK_DRAFT',
    'CASH',
    'CREDIT_CARD',
    'PAYMENT_GATEWAY',
    'OTHER',
];

const CONDITION_TYPES: PaymentConditionType[] = [
    'FULL_PREPAYMENT',
    'PARTIAL_DEPOSIT',
    'CREDIT_DAYS_FROM_INVOICE',
    'PAYMENT_ON_ARRIVAL',
    'PAYMENT_ON_DEPARTURE',
    'CUSTOM',
];

function normalizeCondition(type?: PaymentConditionType | null): PaymentConditionType | null {
    if (!type) return null;
    if (type === 'PREPAYMENT_100') return 'FULL_PREPAYMENT';
    if (type === 'DEPOSIT') return 'PARTIAL_DEPOSIT';
    return type;
}

function buildPaymentPolicy(contract: ContractOutletContext['contract'], fallbackCurrency: string): ContractPaymentPolicy {
    if (contract.paymentPolicy) {
        return {
            marketScope: contract.paymentPolicy.marketScope ?? (contract.currency === 'TND' ? 'NATIONAL' : 'INTERNATIONAL'),
            methods: contract.paymentPolicy.methods ?? [],
            conditions: (contract.paymentPolicy.conditions ?? []).map((condition) => ({
                ...condition,
                type: normalizeCondition(condition.type) ?? 'FULL_PREPAYMENT',
            })),
            deposit: contract.paymentPolicy.deposit ?? null,
            selectedHotelBankAccountId: contract.paymentPolicy.selectedHotelBankAccountId ?? contract.selectedHotelBankAccountId ?? null,
            notes: contract.paymentPolicy.notes ?? null,
        };
    }

    const condition = normalizeCondition(contract.paymentCondition);
    const conditions: ContractPaymentPolicy['conditions'] = [];
    if (condition === 'FULL_PREPAYMENT') {
        conditions.push({ type: 'FULL_PREPAYMENT', percentage: 100 });
    }
    if (condition === 'PARTIAL_DEPOSIT' || Number(contract.depositAmount ?? 0) > 0) {
        conditions.push({ type: 'PARTIAL_DEPOSIT' });
    }
    if (Number(contract.creditDays ?? 0) > 0) {
        conditions.push({ type: 'CREDIT_DAYS_FROM_INVOICE', days: Number(contract.creditDays), basis: 'INVOICE_ISSUE' });
    }

    return {
        marketScope: contract.currency === 'TND' ? 'NATIONAL' : 'INTERNATIONAL',
        methods: (contract.paymentMethods ?? []).map((type, index) => ({ type, isPrimary: index === 0 })),
        conditions,
        deposit: Number(contract.depositAmount ?? 0) > 0
            ? {
                type: 'AMOUNT',
                value: Number(contract.depositAmount),
                currency: contract.currency || fallbackCurrency,
                dueTrigger: 'BOOKING_CONFIRMATION',
                refundable: false,
            }
            : null,
        selectedHotelBankAccountId: contract.selectedHotelBankAccountId ?? null,
        notes: null,
    };
}

function hasCondition(policy: ContractPaymentPolicy | undefined, type: PaymentConditionType) {
    return Boolean(policy?.conditions?.some((condition) => normalizeCondition(condition.type) === type));
}

const paymentMethodLabel = (type: PaymentMethodType, t: TFunction<'common'>) => ({
    BANK_TRANSFER: t('pages.contractDetails.general.payment.methodsList.bankTransfer', { defaultValue: 'Bank transfer' }),
    SWIFT_TRANSFER: t('pages.contractDetails.general.payment.methodsList.swiftTransfer', { defaultValue: 'SWIFT transfer' }),
    BANK_CHECK: t('pages.contractDetails.general.payment.methodsList.bankCheck', { defaultValue: 'Bank check' }),
    BANK_DRAFT: t('pages.contractDetails.general.payment.methodsList.bankDraft', { defaultValue: 'Bank draft / banker' }),
    CASH: t('pages.contractDetails.general.payment.methodsList.cash', { defaultValue: 'Cash' }),
    CREDIT_CARD: t('pages.contractDetails.general.payment.methodsList.creditCard', { defaultValue: 'Credit card' }),
    PAYMENT_GATEWAY: t('pages.contractDetails.general.payment.methodsList.paymentGateway', { defaultValue: 'Payment gateway' }),
    OTHER: t('pages.contractDetails.general.payment.methodsList.other', { defaultValue: 'Other' }),
}[type]);

const paymentConditionLabel = (type: PaymentConditionType, t: TFunction<'common'>) => ({
    FULL_PREPAYMENT: t('pages.contractDetails.general.payment.conditionCards.fullPrepayment', { defaultValue: 'Full prepayment' }),
    PARTIAL_DEPOSIT: t('pages.contractDetails.general.payment.conditionCards.partialDeposit', { defaultValue: 'Partial deposit' }),
    CREDIT_DAYS_FROM_INVOICE: t('pages.contractDetails.general.payment.conditionCards.creditDays', { defaultValue: 'Credit days' }),
    PAYMENT_ON_ARRIVAL: t('pages.contractDetails.general.payment.conditionCards.paymentOnArrival', { defaultValue: 'Payment on arrival' }),
    PAYMENT_ON_DEPARTURE: t('pages.contractDetails.general.payment.conditionCards.paymentOnDeparture', { defaultValue: 'Payment on departure' }),
    CUSTOM: t('pages.contractDetails.general.payment.conditionCards.custom', { defaultValue: 'Custom condition' }),
    DEPOSIT: t('pages.contractDetails.general.payment.conditionCards.partialDeposit', { defaultValue: 'Partial deposit' }),
    PREPAYMENT_100: t('pages.contractDetails.general.payment.conditionCards.fullPrepayment', { defaultValue: 'Full prepayment' }),
}[type]);

export default function GeneralTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { currentHotel } = useHotel();
    const { data: affiliates } = useAffiliates();
    const { data: arrangements } = useArrangements();
    const updateMutation = useUpdateContract(contract.id);
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractGeneralSchema(t), [t]);
    const initialPaymentPolicy = useMemo(() => buildPaymentPolicy(contract, currentHotel?.defaultCurrency ?? contract.currency), [contract, currentHotel?.defaultCurrency]);

    const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<ContractGeneralFormInput, unknown, ContractGeneralFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: contract.name,
            startDate: toInputDate(contract.startDate),
            endDate: toInputDate(contract.endDate),
            currency: contract.currency,
            affiliateIds: contract.affiliates?.map((a) => a.id) ?? [],
            baseArrangementId: contract.baseArrangementId ?? contract.baseArrangement?.id ?? '',
            paymentCondition: contract.paymentCondition ?? 'PREPAYMENT_100',
            depositAmount: contract.depositAmount ?? 0,
            creditDays: contract.creditDays ?? 0,
            paymentMethods: contract.paymentMethods ?? [],
            paymentPolicy: initialPaymentPolicy,
            selectedHotelBankAccountId: initialPaymentPolicy.selectedHotelBankAccountId ?? null,
        },
    });

    useEffect(() => {
        reset({
            name: contract.name,
            startDate: toInputDate(contract.startDate),
            endDate: toInputDate(contract.endDate),
            currency: contract.currency,
            affiliateIds: contract.affiliates?.map((a) => a.id) ?? [],
            baseArrangementId: contract.baseArrangementId ?? contract.baseArrangement?.id ?? '',
            paymentCondition: contract.paymentCondition ?? 'PREPAYMENT_100',
            depositAmount: contract.depositAmount ?? 0,
            creditDays: contract.creditDays ?? 0,
            paymentMethods: contract.paymentMethods ?? [],
            paymentPolicy: initialPaymentPolicy,
            selectedHotelBankAccountId: initialPaymentPolicy.selectedHotelBankAccountId ?? null,
        });
    }, [contract, reset, initialPaymentPolicy]);

    const selectedIds = watch('affiliateIds') || [];
    const paymentPolicy = watch('paymentPolicy') ?? initialPaymentPolicy;
    const marketScope = paymentPolicy.marketScope;
    const paymentMethods = paymentPolicy.methods ?? [];
    const selectedBankAccountId = paymentPolicy.selectedHotelBankAccountId ?? null;
    const selectedBankAccount = currentHotel?.bankAccounts?.find((account) => account.id === selectedBankAccountId) ?? null;

    const toggleAffiliate = (id: number) => {
        setValue('affiliateIds', selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id], { shouldDirty: true });
    };

    const setPaymentPolicy = (policy: ContractPaymentPolicy) => {
        setValue('paymentPolicy', policy, { shouldDirty: true });
        setValue('paymentMethods', policy.methods.map((method) => method.type), { shouldDirty: true });
        setValue('paymentCondition', policy.conditions[0]?.type ?? 'FULL_PREPAYMENT', { shouldDirty: true });
        setValue('depositAmount', policy.deposit?.type === 'AMOUNT' ? policy.deposit.value : 0, { shouldDirty: true });
        setValue('creditDays', policy.conditions.find((condition) => condition.type === 'CREDIT_DAYS_FROM_INVOICE')?.days ?? 0, { shouldDirty: true });
        setValue('selectedHotelBankAccountId', policy.selectedHotelBankAccountId ?? null, { shouldDirty: true });
    };

    const togglePaymentMethod = (type: PaymentMethodType) => {
        const exists = paymentMethods.some((method) => method.type === type);
        const nextMethods = exists
            ? paymentMethods.filter((method) => method.type !== type)
            : [...paymentMethods, { type, isPrimary: paymentMethods.length === 0 }];
        const hasPrimary = nextMethods.some((method) => method.isPrimary);
        setPaymentPolicy({
            ...paymentPolicy,
            methods: nextMethods.map((method, index) => ({ ...method, isPrimary: hasPrimary ? method.isPrimary : index === 0 })),
        });
    };

    const setPrimaryPaymentMethod = (type: PaymentMethodType) => {
        setPaymentPolicy({
            ...paymentPolicy,
            methods: paymentMethods.map((method) => ({ ...method, isPrimary: method.type === type })),
        });
    };

    const togglePaymentCondition = (type: PaymentConditionType) => {
        const exists = hasCondition(paymentPolicy, type);
        const nextConditions = exists
            ? paymentPolicy.conditions.filter((condition) => normalizeCondition(condition.type) !== type)
            : [...paymentPolicy.conditions, {
                type,
                ...(type === 'FULL_PREPAYMENT' ? { percentage: 100 } : {}),
                ...(type === 'CREDIT_DAYS_FROM_INVOICE' ? { days: 15, basis: 'INVOICE_ISSUE' as const } : {}),
            }];
        const needsDeposit = nextConditions.some((condition) => condition.type === 'PARTIAL_DEPOSIT');
        setPaymentPolicy({
            ...paymentPolicy,
            conditions: nextConditions,
            deposit: needsDeposit
                ? paymentPolicy.deposit ?? { type: 'AMOUNT', value: 0, currency: watch('currency') || contract.currency, dueTrigger: 'BOOKING_CONFIRMATION', refundable: false }
                : paymentPolicy.deposit,
        });
    };

    const onSubmit = (data: ContractGeneralFormValues) => {
        const policy = data.paymentPolicy ?? buildPaymentPolicy(contract, data.currency);
        updateMutation.mutate({
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            currency: data.currency,
            affiliateIds: data.affiliateIds,
            baseArrangementId: data.baseArrangementId,
            paymentCondition: policy.conditions[0]?.type,
            depositAmount: policy.deposit?.type === 'AMOUNT' ? policy.deposit.value : 0,
            creditDays: policy.conditions.find((condition) => condition.type === 'CREDIT_DAYS_FROM_INVOICE')?.days ?? 0,
            paymentMethods: policy.methods.map((method) => method.type),
            paymentPolicy: policy,
            selectedHotelBankAccountId: policy.selectedHotelBankAccountId ?? null,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full pb-16" noValidate>
            <ContractSectionShell
                icon={FileText}
                title={t('pages.contractDetails.general.header.title', { defaultValue: 'Contract Settings' })}
                description={t('pages.contractDetails.general.header.subtitle', {
                    defaultValue: 'Configure contract identity, dates, partners, and payment rules.',
                })}
                bodyClassName="space-y-12"
                action={(
                    <button
                        type="submit"
                        disabled={!isDirty || updateMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    >
                        {updateMutation.isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-light border-t-transparent" />
                        ) : (
                            <Save size={16} />
                        )}
                        <span>{t('actions.save', { defaultValue: 'Save' })}</span>
                        {isDirty && <span className="font-bold text-brand-mint">*</span>}
                    </button>
                )}
            >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {t('pages.contractDetails.general.identity.title', { defaultValue: 'Identity & Partners' })}
                        </h3>
                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/70 leading-relaxed">
                            {t('pages.contractDetails.general.identity.subtitle', {
                                defaultValue: 'Internal contract label and linked tour operators.',
                            })}
                        </p>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <div className="max-w-xl">
                            <label htmlFor="general-name" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                {t('pages.contractDetails.general.identity.contractName', { defaultValue: 'Contract name / label' })}
                            </label>
                            <input
                                id="general-name"
                                type="text"
                                {...register('name')}
                                className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 border-b border-brand-slate/20 dark:border-brand-light/10 pb-2">
                                <label className="block text-sm font-medium text-brand-navy dark:text-brand-light">
                                    {t('pages.contractDetails.general.identity.affiliates', { defaultValue: 'Tour Operators (Affiliates)' })}
                                </label>
                                <span className="text-xs font-medium text-brand-slate">
                                    {t('pages.contractDetails.general.identity.selectedCount', {
                                        defaultValue: '{{count}} selected',
                                        count: selectedIds.length,
                                    })}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {affiliates?.length === 0 && (
                                    <div className="col-span-full py-4 text-sm text-brand-slate">
                                        {t('pages.contractDetails.general.identity.noPartners', { defaultValue: 'No partner available' })}
                                    </div>
                                )}
                                {affiliates?.map((a) => (
                                    <label
                                        key={a.id}
                                        className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedIds.includes(a.id) ? 'bg-brand-mint/10 border-brand-mint/30 shadow-sm ring-1 ring-brand-mint' : 'bg-brand-light border-brand-slate/20 hover:border-brand-slate/20 shadow-sm'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(a.id)}
                                            onChange={() => toggleAffiliate(a.id)}
                                            className="mt-0.5 w-4 h-4 text-brand-mint bg-brand-light border-brand-slate/20 rounded focus:ring-brand-mint cursor-pointer transition-colors"
                                        />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`text-sm font-medium truncate ${selectedIds.includes(a.id) ? 'text-brand-mint' : 'text-brand-navy'}`}>{a.companyName}</span>
                                            {a.reference && <span className="text-xs text-brand-slate font-mono mt-0.5">{a.reference}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-brand-slate/20" />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {t('pages.contractDetails.general.period.title', { defaultValue: 'Period & Currency' })}
                        </h3>
                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/70 leading-relaxed">
                            {t('pages.contractDetails.general.period.subtitle', {
                                defaultValue: 'Application dates and reference currency for all related rates.',
                            })}
                        </p>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
                            <div>
                                <label htmlFor="general-start-date" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                    {t('pages.contractDetails.general.period.startDate', { defaultValue: 'Start date' })}
                                </label>
                                <input
                                    id="general-start-date"
                                    type="date"
                                    {...register('startDate')}
                                    className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="general-end-date" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                    {t('pages.contractDetails.general.period.endDate', { defaultValue: 'End date' })}
                                </label>
                                <input
                                    id="general-end-date"
                                    type="date"
                                    {...register('endDate')}
                                    className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="general-currency" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                    {t('pages.contractDetails.general.period.currency', { defaultValue: 'Applied currency' })}
                                </label>
                                <select
                                    id="general-currency"
                                    {...register('currency')}
                                    className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm cursor-pointer"
                                >
                                    <option value="EUR">{t('pages.contractDetails.general.currencies.eur', { defaultValue: 'EUR - Euro (€)' })}</option>
                                    <option value="USD">{t('pages.contractDetails.general.currencies.usd', { defaultValue: 'USD - US Dollar ($)' })}</option>
                                    <option value="GBP">{t('pages.contractDetails.general.currencies.gbp', { defaultValue: 'GBP - Pound Sterling (£)' })}</option>
                                    <option value="TND">{t('pages.contractDetails.general.currencies.tnd', { defaultValue: 'TND - Tunisian Dinar (د.ت)' })}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-brand-slate/20" />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {t('pages.contractDetails.general.specifications.title', { defaultValue: 'Specifications' })}
                        </h3>
                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/70 leading-relaxed">
                            {t('pages.contractDetails.general.specifications.subtitle', { defaultValue: 'Constraint on the base arrangement.' })}
                        </p>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="max-w-xl">
                            <label htmlFor="general-arrangement" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                {t('pages.contractDetails.general.specifications.strictArrangement', { defaultValue: 'Strict arrangement (optional)' })}
                            </label>
                            <select
                                id="general-arrangement"
                                {...register('baseArrangementId')}
                                className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm cursor-pointer"
                            >
                                <option value="">
                                    {t('pages.contractDetails.general.specifications.noArrangement', { defaultValue: 'None (multi-board allowed in rates)' })}
                                </option>
                                {arrangements?.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.code} - {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <hr className="border-brand-slate/20" />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {t('pages.contractDetails.general.payment.title', { defaultValue: 'Payment Policy' })}
                        </h3>
                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/70 leading-relaxed">
                            {t('pages.contractDetails.general.payment.subtitle', { defaultValue: 'Separate how the partner pays from when the partner pays.' })}
                        </p>
                    </div>

                    <div className="lg:col-span-3 max-w-5xl space-y-8">
                        <div className="max-w-sm">
                            <label htmlFor="general-payment-market" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                {t('pages.contractDetails.general.payment.marketScope', { defaultValue: 'Market scope' })}
                            </label>
                            <select
                                id="general-payment-market"
                                value={marketScope}
                                onChange={(event) => setPaymentPolicy({ ...paymentPolicy, marketScope: event.target.value as ContractMarketScope })}
                                className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm cursor-pointer dark:bg-brand-light/5 dark:border-brand-light/10 dark:text-brand-light"
                            >
                                <option value="INTERNATIONAL">{t('pages.contractDetails.general.payment.market.international', { defaultValue: 'International' })}</option>
                                <option value="NATIONAL">{t('pages.contractDetails.general.payment.market.national', { defaultValue: 'National / local' })}</option>
                                <option value="MIXED">{t('pages.contractDetails.general.payment.market.mixed', { defaultValue: 'Mixed' })}</option>
                            </select>
                            <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/70">
                                {marketScope === 'NATIONAL'
                                    ? t('pages.contractDetails.general.payment.helperNational', { defaultValue: 'Recommended for Tunisian agencies: TND, local bank transfer, RIB, bank check, or cash.' })
                                    : t('pages.contractDetails.general.payment.helperInternational', { defaultValue: 'Recommended for international operators: SWIFT transfer with IBAN/SWIFT and EUR or USD.' })}
                            </p>
                        </div>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <WalletCards size={18} className="text-brand-mint" />
                                <h4 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                    {t('pages.contractDetails.general.payment.howPartnerPays', { defaultValue: 'How the partner pays' })}
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                {PAYMENT_METHODS.map((method) => {
                                    const selected = paymentMethods.some((entry) => entry.type === method);
                                    const primary = paymentMethods.some((entry) => entry.type === method && entry.isPrimary);
                                    return (
                                        <label
                                            key={method}
                                            className={`min-h-24 rounded-xl border p-3 cursor-pointer transition-all ${selected ? 'bg-brand-mint/10 border-brand-mint/40 shadow-sm' : 'bg-brand-light border-brand-slate/20 shadow-sm hover:border-brand-slate/40 dark:bg-brand-light/5 dark:border-brand-light/10 dark:hover:border-brand-light/25'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => togglePaymentMethod(method)}
                                                    className="mt-0.5 w-4 h-4 text-brand-mint border-brand-slate/20 focus:ring-brand-mint rounded cursor-pointer"
                                                />
                                                <div className="min-w-0">
                                                    <span className={`block text-sm font-medium ${selected ? 'text-brand-mint' : 'text-brand-navy dark:text-brand-light'}`}>{paymentMethodLabel(method, t)}</span>
                                                    {primary && <span className="mt-1 block text-xs font-semibold text-brand-navy/70 dark:text-brand-light/70">{t('pages.contractDetails.general.payment.primary', { defaultValue: 'Primary' })}</span>}
                                                </div>
                                            </div>
                                            {selected && (
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        setPrimaryPaymentMethod(method);
                                                    }}
                                                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-mint dark:text-brand-light dark:hover:text-brand-mint"
                                                >
                                                    <Landmark size={13} />
                                                    {t('pages.contractDetails.general.payment.makePrimary', { defaultValue: 'Make primary' })}
                                                </button>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <div>
                                    <label htmlFor="general-bank-account" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                        {t('pages.contractDetails.general.payment.bankAccount', { defaultValue: 'Selected hotel bank account' })}
                                    </label>
                                    <select
                                        id="general-bank-account"
                                        value={selectedBankAccountId ?? ''}
                                        onChange={(event) => setPaymentPolicy({ ...paymentPolicy, selectedHotelBankAccountId: event.target.value ? Number(event.target.value) : null })}
                                        className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm cursor-pointer dark:bg-brand-light/5 dark:border-brand-light/10 dark:text-brand-light"
                                    >
                                        <option value="">{t('pages.contractDetails.general.payment.noBankAccount', { defaultValue: 'Use legacy hotel bank details / none' })}</option>
                                        {currentHotel?.bankAccounts?.filter((account) => account.active).map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.label} - {account.currency ?? currentHotel.defaultCurrency}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {paymentMethods.some((method) => method.type === 'SWIFT_TRANSFER') && selectedBankAccount && (!selectedBankAccount.iban || !selectedBankAccount.swiftCode) && (
                                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
                                        {t('pages.contractDetails.general.payment.swiftWarning', { defaultValue: 'SWIFT transfer is selected, but this bank account is missing IBAN or SWIFT/BIC.' })}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Banknote size={18} className="text-brand-mint" />
                                <h4 className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                    {t('pages.contractDetails.general.payment.whenPartnerPays', { defaultValue: 'When the partner pays' })}
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {CONDITION_TYPES.map((conditionType) => {
                                    const selected = hasCondition(paymentPolicy, conditionType);
                                    return (
                                        <label key={conditionType} className={`rounded-xl border p-4 cursor-pointer transition-all ${selected ? 'border-brand-mint/40 bg-brand-mint/10 shadow-sm' : 'border-brand-slate/20 bg-brand-light shadow-sm hover:border-brand-slate/40 dark:border-brand-light/10 dark:bg-brand-light/5 dark:hover:border-brand-light/25'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => togglePaymentCondition(conditionType)}
                                                    className="w-4 h-4 text-brand-mint border-brand-slate/20 focus:ring-brand-mint rounded cursor-pointer"
                                                />
                                                <span className={`text-sm font-semibold ${selected ? 'text-brand-mint' : 'text-brand-navy dark:text-brand-light'}`}>{paymentConditionLabel(conditionType, t)}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {hasCondition(paymentPolicy, 'PARTIAL_DEPOSIT') && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-brand-slate/20 bg-brand-light p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-navy mb-1.5 dark:text-brand-light">{t('pages.contractDetails.general.payment.depositType', { defaultValue: 'Deposit type' })}</label>
                                        <select
                                            value={paymentPolicy.deposit?.type ?? 'AMOUNT'}
                                            onChange={(event) => setPaymentPolicy({ ...paymentPolicy, deposit: { ...(paymentPolicy.deposit ?? { value: 0 }), type: event.target.value as 'AMOUNT' | 'PERCENTAGE', currency: watch('currency') } })}
                                            className="w-full px-3 py-2 bg-white border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light"
                                        >
                                            <option value="AMOUNT">{t('pages.contractDetails.general.payment.depositAmountType', { defaultValue: 'Amount' })}</option>
                                            <option value="PERCENTAGE">{t('pages.contractDetails.general.payment.depositPercentageType', { defaultValue: 'Percentage' })}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-navy mb-1.5 dark:text-brand-light">{t('pages.contractDetails.general.payment.depositValue', { defaultValue: 'Deposit value' })}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={paymentPolicy.deposit?.value ?? 0}
                                            onChange={(event) => setPaymentPolicy({ ...paymentPolicy, deposit: { ...(paymentPolicy.deposit ?? { type: 'AMOUNT', currency: watch('currency') }), value: Number(event.target.value) } })}
                                            className="w-full px-3 py-2 bg-white border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-navy mb-1.5 dark:text-brand-light">{t('pages.contractDetails.general.payment.dueTrigger', { defaultValue: 'Due trigger' })}</label>
                                        <select
                                            value={paymentPolicy.deposit?.dueTrigger ?? 'BOOKING_CONFIRMATION'}
                                            onChange={(event) => setPaymentPolicy({ ...paymentPolicy, deposit: { ...(paymentPolicy.deposit ?? { type: 'AMOUNT', value: 0, currency: watch('currency') }), dueTrigger: event.target.value as PaymentDueTrigger } })}
                                            className="w-full px-3 py-2 bg-white border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light"
                                        >
                                            <option value="BOOKING_CONFIRMATION">{t('pages.contractDetails.general.payment.bookingConfirmation', { defaultValue: 'Booking confirmation' })}</option>
                                            <option value="BEFORE_CHECK_IN">{t('pages.contractDetails.general.payment.beforeCheckIn', { defaultValue: 'Before check-in' })}</option>
                                            <option value="INVOICE_ISSUE">{t('pages.contractDetails.general.payment.invoiceIssue', { defaultValue: 'Invoice issue' })}</option>
                                            <option value="CUSTOM">{t('pages.contractDetails.general.payment.custom', { defaultValue: 'Custom' })}</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-2 self-end rounded-xl border border-brand-slate/20 bg-white px-3 py-2 text-sm font-medium text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(paymentPolicy.deposit?.refundable)}
                                            onChange={(event) => setPaymentPolicy({ ...paymentPolicy, deposit: { ...(paymentPolicy.deposit ?? { type: 'AMOUNT', value: 0, currency: watch('currency') }), refundable: event.target.checked } })}
                                            className="w-4 h-4 rounded border-brand-slate/20 text-brand-mint"
                                        />
                                        {t('pages.contractDetails.general.payment.refundable', { defaultValue: 'Refundable' })}
                                    </label>
                                </div>
                            )}

                            {hasCondition(paymentPolicy, 'CREDIT_DAYS_FROM_INVOICE') && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-brand-slate/20 bg-brand-light p-4 max-w-2xl dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-navy mb-1.5 dark:text-brand-light">{t('pages.contractDetails.general.payment.creditDays', { defaultValue: 'Credit days' })}</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={paymentPolicy.conditions.find((condition) => condition.type === 'CREDIT_DAYS_FROM_INVOICE')?.days ?? 15}
                                            onChange={(event) => setPaymentPolicy({
                                                ...paymentPolicy,
                                                conditions: paymentPolicy.conditions.map((condition) => condition.type === 'CREDIT_DAYS_FROM_INVOICE' ? { ...condition, days: Number(event.target.value) } : condition),
                                            })}
                                            className="w-full px-3 py-2 bg-white border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-navy mb-1.5 dark:text-brand-light">{t('pages.contractDetails.general.payment.creditBasis', { defaultValue: 'Basis' })}</label>
                                        <select
                                            value={paymentPolicy.conditions.find((condition) => condition.type === 'CREDIT_DAYS_FROM_INVOICE')?.basis ?? 'INVOICE_ISSUE'}
                                            onChange={(event) => setPaymentPolicy({
                                                ...paymentPolicy,
                                                conditions: paymentPolicy.conditions.map((condition) => condition.type === 'CREDIT_DAYS_FROM_INVOICE' ? { ...condition, basis: event.target.value as PaymentConditionBasis } : condition),
                                            })}
                                            className="w-full px-3 py-2 bg-white border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light"
                                        >
                                            <option value="INVOICE_ISSUE">{t('pages.contractDetails.general.payment.invoiceIssue', { defaultValue: 'Invoice issue' })}</option>
                                            <option value="INVOICE_RECEIPT">{t('pages.contractDetails.general.payment.invoiceReceipt', { defaultValue: 'Invoice receipt' })}</option>
                                            <option value="CHECK_OUT">{t('pages.contractDetails.general.payment.checkOut', { defaultValue: 'Check-out' })}</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {hasCondition(paymentPolicy, 'CUSTOM') && (
                                <div className="rounded-xl border border-brand-slate/20 bg-brand-light p-4 max-w-2xl dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <label className="block text-sm font-medium text-brand-navy mb-1.5 dark:text-brand-light">{t('pages.contractDetails.general.payment.customNotes', { defaultValue: 'Custom condition notes' })}</label>
                                    <textarea
                                        value={paymentPolicy.conditions.find((condition) => condition.type === 'CUSTOM')?.notes ?? ''}
                                        onChange={(event) => setPaymentPolicy({
                                            ...paymentPolicy,
                                            conditions: paymentPolicy.conditions.map((condition) => condition.type === 'CUSTOM' ? { ...condition, notes: event.target.value } : condition),
                                        })}
                                        className="min-h-24 w-full px-3 py-2 bg-white border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:bg-brand-navy/60 dark:border-brand-light/10 dark:text-brand-light"
                                    />
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </ContractSectionShell>
        </form>
    );
}
