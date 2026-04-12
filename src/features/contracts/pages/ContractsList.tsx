import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useArrangements } from '../../arrangements/hooks/useArrangements';
import { useContracts, useCreateContract } from '../hooks/useContracts';
import { Calendar, ExternalLink, FileText, Handshake, Layers, Plus, ShieldCheck } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import type { ContractStatus } from '../types/contract.types';
import { createContractSchema, type CreateContractFormInput, type CreateContractFormValues } from '../schemas/contract.schema';

function formatDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

const inputClassName = 'w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-white/10 dark:bg-white/5 dark:text-brand-light';
const labelClassName = 'mb-1 block text-sm font-medium text-brand-navy dark:text-brand-light';

export default function ContractsList() {
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const { data: contracts, isLoading, isError } = useContracts();
    const { data: affiliates = [] } = useAffiliates();
    const { data: arrangements = [] } = useArrangements();
    const createMutation = useCreateContract();
    const schema = useMemo(() => createContractSchema(t), [t]);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateContractFormInput, unknown, CreateContractFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            startDate: '',
            endDate: '',
            currency: 'TND',
            affiliateIds: [],
            baseArrangementId: null,
        },
    });

    const selectedAffiliateIds = watch('affiliateIds');
    const activeContracts = useMemo(() => contracts?.filter((contract) => contract.status === 'ACTIVE').length ?? 0, [contracts]);
    const draftContracts = useMemo(() => contracts?.filter((contract) => contract.status === 'DRAFT').length ?? 0, [contracts]);
    const partnerCoverage = useMemo(() => {
        const ids = contracts?.flatMap((contract) => contract.affiliates?.map((affiliate) => affiliate.id) ?? []) ?? [];
        return new Set(ids).size;
    }, [contracts]);

    const toggleAffiliate = (id: number) => {
        const current = selectedAffiliateIds ?? [];
        setValue('affiliateIds', current.includes(id) ? current.filter((value) => value !== id) : [...current, id], { shouldValidate: true });
    };

    const openCreate = () => {
        reset({ name: '', startDate: '', endDate: '', currency: 'TND', affiliateIds: [], baseArrangementId: null });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const onSubmit = (data: CreateContractFormValues) => {
        createMutation.mutate({
            ...data,
        }, {
            onSuccess: closeModal,
        });
    };

    const getStatusConfig = (status: ContractStatus) => {
        switch (status) {
            case 'DRAFT':
                return {
                    className: 'border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75',
                    label: t('pages.contractDetails.status.draft', { defaultValue: 'Draft' }),
                };
            case 'ACTIVE':
                return {
                    className: 'border-brand-mint/20 bg-brand-mint/8 text-brand-mint',
                    label: t('pages.contractDetails.status.active', { defaultValue: 'Active' }),
                };
            case 'EXPIRED':
                return {
                    className: 'border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75',
                    label: t('pages.contractDetails.status.expired', { defaultValue: 'Expired' }),
                };
            case 'TERMINATED':
            default:
                return {
                    className: 'border-brand-slate/20 bg-brand-light text-brand-slate dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75',
                    label: t('pages.contractDetails.status.terminated', { defaultValue: 'Terminated' }),
                };
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <section className="premium-surface relative overflow-hidden p-6 md:p-7">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-brand-mint/10 dark:bg-brand-navy/80" />
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.contracts.header.eyebrow', { defaultValue: 'Commercial Agreements' })}
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-white">
                            {t('pages.contracts.header.title', { defaultValue: 'Contracts command center.' })}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {t('pages.contracts.header.subtitle', { defaultValue: 'Create partner agreements, monitor active selling windows, and open the pricing workbench for each contract.' })}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                    >
                        <Plus size={16} />
                        {t('pages.contracts.header.newContract', { defaultValue: 'New contract' })}
                    </button>
                </div>

                <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: t('pages.contracts.metrics.total', { defaultValue: 'Total contracts' }), value: contracts?.length ?? 0, icon: FileText },
                        { label: t('pages.contracts.metrics.active', { defaultValue: 'Active contracts' }), value: activeContracts, icon: ShieldCheck },
                        { label: t('pages.contracts.metrics.drafts', { defaultValue: 'Drafts' }), value: draftContracts, icon: Layers },
                        { label: t('pages.contracts.metrics.partners', { defaultValue: 'Partners covered' }), value: partnerCoverage, icon: Handshake },
                    ].map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <div key={metric.label} className="rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-medium text-brand-slate">{metric.label}</p>
                                    <div className="rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                                        <Icon size={18} />
                                    </div>
                                </div>
                                <p className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy dark:text-white">{metric.value}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {isLoading && (
                <div className="premium-surface flex h-48 items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="premium-surface border-brand-slate/30 bg-brand-slate/10 p-6 text-sm text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                    {t('pages.contracts.errors.loadFailed', { defaultValue: 'Unable to load contracts right now.' })}
                </div>
            )}

            {!isLoading && !isError && contracts?.length === 0 && (
                <section className="premium-surface border-dashed p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-mint/10 text-brand-mint">
                        <FileText size={30} />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-brand-navy dark:text-white">
                        {t('pages.contracts.empty.title', { defaultValue: 'No contracts yet' })}
                    </h2>
                    <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                        {t('pages.contracts.empty.subtitle', { defaultValue: 'Create your first contract to start building pricing rules.' })}
                    </p>
                </section>
            )}

            {contracts && contracts.length > 0 && (
                <section className="premium-surface overflow-hidden p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                {t('pages.contracts.table.eyebrow', { defaultValue: 'Portfolio' })}
                            </p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-white">
                                {t('pages.contracts.table.title', { defaultValue: 'Contract roster' })}
                            </h2>
                        </div>
                        <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                            {t('pages.contracts.table.count', { defaultValue: '{{count}} contracts', count: contracts.length })}
                        </span>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-white/70 bg-white/55 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-white/70 text-brand-slate dark:bg-white/5">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{t('pages.contracts.table.name', { defaultValue: 'Contract' })}</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{t('pages.contracts.table.partner', { defaultValue: 'Partners' })}</th>
                                        <th className="px-5 py-4 text-center font-semibold uppercase tracking-[0.18em]">{t('pages.contracts.table.window', { defaultValue: 'Window' })}</th>
                                        <th className="px-5 py-4 text-center font-semibold uppercase tracking-[0.18em]">{t('pages.contracts.table.status', { defaultValue: 'Status' })}</th>
                                        <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">{t('pages.contracts.table.actions', { defaultValue: 'Actions' })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/60 dark:divide-white/10">
                                    {contracts.map((contract) => {
                                        const status = getStatusConfig(contract.status);
                                        const affiliatesForContract = contract.affiliates ?? [];
                                        const shownAffiliates = affiliatesForContract.slice(0, 2).map((affiliate) => affiliate.companyName).join(', ');

                                        return (
                                            <tr key={contract.id} className="bg-white/35 transition hover:bg-white/60 dark:bg-transparent dark:hover:bg-white/5">
                                                <td className="px-5 py-4 align-top">
                                                    <p className="font-semibold text-brand-navy dark:text-white">{contract.name}</p>
                                                    <p className="mt-1 font-mono text-xs text-brand-slate dark:text-brand-light/75">{contract.reference || `#${contract.id}`}</p>
                                                </td>
                                                <td className="px-5 py-4 align-top text-brand-slate dark:text-brand-light/75">
                                                    {affiliatesForContract.length === 0 ? (
                                                        <span>{t('common.notAvailable', { defaultValue: 'N/A' })}</span>
                                                    ) : (
                                                        <span>
                                                            {shownAffiliates}
                                                            {affiliatesForContract.length > 2 && (
                                                                <span className="ml-2 inline-flex rounded-full border border-brand-mint/15 bg-brand-mint/8 px-2 py-0.5 text-xs font-semibold text-brand-mint">
                                                                    +{affiliatesForContract.length - 2}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 align-top text-center">
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-navy dark:border-white/10 dark:bg-white/5 dark:text-white">
                                                        <Calendar size={13} className="text-brand-mint" />
                                                        {formatDate(contract.startDate, locale)} to {formatDate(contract.endDate, locale)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-top text-center">
                                                    <span className={clsx('premium-pill', status.className)}>{status.label}</span>
                                                </td>
                                                <td className="px-5 py-4 align-top text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/contracts/${contract.id}`)}
                                                        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-white"
                                                    >
                                                        <ExternalLink size={14} />
                                                        {t('actions.open', { defaultValue: 'Open' })}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={t('pages.contracts.modal.title', { defaultValue: 'New contract' })} maxWidth="max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className={labelClassName}>{t('pages.contracts.modal.currency', { defaultValue: 'Currency' })}</label>
                            <input
                                {...register('currency')}
                                placeholder={t('auto.features.contracts.pages.contractslist.placeholder.7f2c3259', { defaultValue: "TND" })}
                                maxLength={3}
                                className={`${inputClassName} font-mono uppercase tracking-widest`}
                            />
                            {errors.currency && <p className="mt-1 text-xs text-brand-slate">{errors.currency.message}</p>}
                        </div>
                        <div>
                            <label className={labelClassName}>{t('pages.contracts.modal.baseArrangement', { defaultValue: 'Base arrangement' })}</label>
                            <select {...register('baseArrangementId')} className={inputClassName}>
                                <option value="">{t('pages.contracts.modal.noArrangement', { defaultValue: 'None, all boards allowed' })}</option>
                                {arrangements.map((arrangement) => (
                                    <option key={arrangement.id} value={arrangement.id}>{arrangement.code} - {arrangement.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClassName}>{t('pages.contracts.modal.name', { defaultValue: 'Contract name' })}</label>
                        <input
                            {...register('name')}
                            placeholder={t('pages.contracts.modal.namePlaceholder', { defaultValue: 'Summer 2026 - Partner contract' })}
                            className={inputClassName}
                        />
                        {errors.name && <p className="mt-1 text-xs text-brand-slate">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className={labelClassName}>{t('pages.contracts.modal.partners', { defaultValue: 'Partners' })}</label>
                        <input type="hidden" {...register('affiliateIds')} />
                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                            {affiliates.length === 0 && (
                                <p className="px-3 py-2 text-xs text-brand-slate dark:text-brand-light/75">
                                    {t('pages.contracts.modal.noPartners', { defaultValue: 'No partners available' })}
                                </p>
                            )}
                            {affiliates.map((affiliate) => (
                                <label key={affiliate.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-brand-navy transition hover:border-brand-mint/15 hover:bg-brand-mint/8 dark:text-brand-light dark:hover:bg-brand-mint/10">
                                    <input
                                        type="checkbox"
                                        checked={selectedAffiliateIds?.includes(affiliate.id) ?? false}
                                        onChange={() => toggleAffiliate(affiliate.id)}
                                        className="rounded border-brand-slate/30 text-brand-mint focus:ring-brand-mint"
                                    />
                                    {affiliate.companyName}
                                </label>
                            ))}
                        </div>
                        {errors.affiliateIds && <p className="mt-1 text-xs text-brand-slate">{errors.affiliateIds.message}</p>}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className={labelClassName}>{t('pages.contracts.modal.startDate', { defaultValue: 'Start date' })}</label>
                            <input type="date" {...register('startDate')} className={inputClassName} />
                            {errors.startDate && <p className="mt-1 text-xs text-brand-slate">{errors.startDate.message}</p>}
                        </div>
                        <div>
                            <label className={labelClassName}>{t('pages.contracts.modal.endDate', { defaultValue: 'End date' })}</label>
                            <input
                                type="date"
                                {...register('endDate')}
                                className={inputClassName}
                            />
                            {errors.endDate && <p className="mt-1 text-xs text-brand-slate">{errors.endDate.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-brand-slate/15 pt-3 dark:border-brand-slate/20">
                        <button type="button" onClick={closeModal} className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75 dark:hover:text-white">
                            {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button type="submit" disabled={createMutation.isPending} className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-mint disabled:opacity-50">
                            {createMutation.isPending
                                ? t('pages.contracts.modal.creating', { defaultValue: 'Creating...' })
                                : t('pages.contracts.modal.submit', { defaultValue: 'Create contract' })}
                        </button>
                    </div>
                    {createMutation.isError && (
                        <p className="text-xs text-brand-slate">
                            {t('pages.contracts.modal.error', { defaultValue: 'Could not create the contract. Check the entered data.' })}
                        </p>
                    )}
                </form>
            </Modal>
        </div>
    );
}
