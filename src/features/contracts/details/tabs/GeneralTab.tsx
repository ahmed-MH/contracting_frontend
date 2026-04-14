import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateContract } from '../../hooks/useContracts';
import { useAffiliates } from '../../../partners/hooks/useAffiliates';
import { useArrangements } from '../../../arrangements/hooks/useArrangements';
import { FileText, Save } from 'lucide-react';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { ContractSectionShell } from '../components/ContractSection';
import {
    createContractGeneralSchema,
    type ContractGeneralFormInput,
    type ContractGeneralFormValues,
} from '../schemas/contract-detail.schema';

function toInputDate(iso: string): string {
    return iso ? iso.substring(0, 10) : '';
}

export default function GeneralTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { data: affiliates } = useAffiliates();
    const { data: arrangements } = useArrangements();
    const updateMutation = useUpdateContract(contract.id);
    const { t } = useTranslation('common');
    const schema = useMemo(() => createContractGeneralSchema(t), [t]);

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
        });
    }, [contract, reset]);

    const selectedIds = watch('affiliateIds') || [];
    const paymentCondition = watch('paymentCondition');
    const paymentMethods = watch('paymentMethods') || [];

    const toggleAffiliate = (id: number) => {
        setValue('affiliateIds', selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id], { shouldDirty: true });
    };

    const togglePaymentMethod = (method: 'BANK_TRANSFER' | 'BANK_CHECK') => {
        setValue('paymentMethods', paymentMethods.includes(method) ? paymentMethods.filter((x) => x !== method) : [...paymentMethods, method], { shouldDirty: true });
    };

    const onSubmit = (data: ContractGeneralFormValues) => {
        updateMutation.mutate({
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            currency: data.currency,
            affiliateIds: data.affiliateIds,
            baseArrangementId: data.baseArrangementId,
            paymentCondition: data.paymentCondition,
            depositAmount: data.depositAmount,
            creditDays: data.creditDays,
            paymentMethods: data.paymentMethods,
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
                            {t('pages.contractDetails.general.payment.title', { defaultValue: 'Billing & Payment' })}
                        </h3>
                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/70 leading-relaxed">
                            {t('pages.contractDetails.general.payment.subtitle', { defaultValue: 'Release conditions and payment methods.' })}
                        </p>
                    </div>

                    <div className="lg:col-span-3 max-w-4xl space-y-8">
                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1.5">
                                {t('pages.contractDetails.general.payment.methods', { defaultValue: 'Allowed payment methods' })}
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-xl cursor-pointer transition-all ${paymentMethods.includes('BANK_TRANSFER') ? 'bg-brand-mint/10 border-brand-mint/30 shadow-sm' : 'bg-brand-light border-brand-slate/20 shadow-sm hover:border-brand-slate/20'}`}>
                                    <input
                                        type="checkbox"
                                        checked={paymentMethods.includes('BANK_TRANSFER')}
                                        onChange={() => togglePaymentMethod('BANK_TRANSFER')}
                                        className="w-4 h-4 text-brand-mint border-brand-slate/20 focus:ring-brand-mint rounded cursor-pointer"
                                    />
                                    <span className={`text-sm font-medium ${paymentMethods.includes('BANK_TRANSFER') ? 'text-brand-mint' : 'text-brand-navy'}`}>
                                        {t('pages.contractDetails.general.payment.bankTransfer', { defaultValue: 'Bank Transfer' })}
                                    </span>
                                </label>
                                <label className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-xl cursor-pointer transition-all ${paymentMethods.includes('BANK_CHECK') ? 'bg-brand-mint/10 border-brand-mint/30 shadow-sm' : 'bg-brand-light border-brand-slate/20 shadow-sm hover:border-brand-slate/20'}`}>
                                    <input
                                        type="checkbox"
                                        checked={paymentMethods.includes('BANK_CHECK')}
                                        onChange={() => togglePaymentMethod('BANK_CHECK')}
                                        className="w-4 h-4 text-brand-mint border-brand-slate/20 focus:ring-brand-mint rounded cursor-pointer"
                                    />
                                    <span className={`text-sm font-medium ${paymentMethods.includes('BANK_CHECK') ? 'text-brand-mint' : 'text-brand-navy'}`}>
                                        {t('pages.contractDetails.general.payment.bankCheck', { defaultValue: 'Bank Check' })}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="max-w-xl">
                            <label htmlFor="general-payment-condition" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                {t('pages.contractDetails.general.payment.releaseCondition', { defaultValue: 'Release condition' })}
                            </label>
                            <select
                                id="general-payment-condition"
                                {...register('paymentCondition')}
                                className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm cursor-pointer"
                            >
                                <option value="PREPAYMENT_100">
                                    {t('pages.contractDetails.general.payment.conditions.prepayment', { defaultValue: '100% Prepayment' })}
                                </option>
                                <option value="DEPOSIT">
                                    {t('pages.contractDetails.general.payment.conditions.deposit', { defaultValue: 'Deposit Contract (Credit)' })}
                                </option>
                            </select>
                        </div>

                        {paymentCondition === 'DEPOSIT' && (
                            <div className="bg-brand-light dark:bg-brand-light/5 p-5 rounded-xl border border-brand-slate/20 dark:border-brand-light/10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                                <div>
                                    <label htmlFor="general-deposit-amount" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                        {t('pages.contractDetails.general.payment.depositAmount', { defaultValue: 'Deposit Amount' })}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="general-deposit-amount"
                                            type="number"
                                            step="0.01"
                                            {...register('depositAmount', { valueAsNumber: true })}
                                            className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-slate font-medium z-10 select-none">
                                            {watch('currency')}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="general-credit-days" className="block text-sm font-medium text-brand-navy dark:text-brand-light mb-1.5">
                                        {t('pages.contractDetails.general.payment.creditDelay', { defaultValue: 'Credit Delay' })}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="general-credit-days"
                                            type="number"
                                            {...register('creditDays', { valueAsNumber: true })}
                                            className="w-full px-4 py-2 bg-brand-light border border-brand-slate/20 rounded-xl text-sm text-brand-navy focus:ring-2 focus:ring-brand-mint focus:border-brand-mint/30 outline-none transition-shadow shadow-sm pr-16"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-slate font-medium z-10 select-none">
                                            {t('pages.contractDetails.general.payment.days', { defaultValue: 'Days' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ContractSectionShell>
        </form>
    );
}
