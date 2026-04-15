import { useMemo, useState } from 'react';
import { ArrowRightLeft, Calendar, Coins, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useHotel } from '../../hotel/context/HotelContext';
import { useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate, useDeleteExchangeRate } from '../hooks/useExchangeRates';
import type { ExchangeRate, CreateExchangeRatePayload, UpdateExchangeRatePayload } from '../types/exchange-rate.types';
import EditExchangeRateModal from './EditExchangeRateModal';

function formatRate(rate: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(Number(rate));
}

function normalizeCurrency(currency?: string | null) {
    return (currency || '').trim().toUpperCase();
}

export default function ExchangeRatesSection() {
    const { currentHotel } = useHotel();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
    const isAdminOrCommercial = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

    const hotelId = currentHotel?.id || 0;
    const { data: rates = [], isLoading } = useExchangeRates(hotelId);

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRate(null);
    };

    const createMutation = useCreateExchangeRate(hotelId, closeModal);
    const updateMutation = useUpdateExchangeRate(hotelId, closeModal);
    const deleteMutation = useDeleteExchangeRate(hotelId);

    const supportedCurrencies = useMemo(() => {
        const values = new Set<string>();
        if (currentHotel?.defaultCurrency) values.add(normalizeCurrency(currentHotel.defaultCurrency));
        rates.forEach((rate) => {
            values.add(normalizeCurrency(rate.fromCurrency));
            values.add(normalizeCurrency(rate.toCurrency));
        });
        return [...values].filter(Boolean).sort();
    }, [currentHotel?.defaultCurrency, rates]);

    const handleCreate = (data: CreateExchangeRatePayload) => {
        createMutation.mutate(data);
    };

    const handleUpdate = (data: UpdateExchangeRatePayload) => {
        if (editingRate) {
            updateMutation.mutate({ id: editingRate.id, data });
        }
    };

    const handleDelete = async (rate: ExchangeRate) => {
        if (
            await confirm({
                title: t('pages.exchangeRates.deleteTitle', { defaultValue: 'Delete this exchange rate?' }),
                description: t('pages.exchangeRates.deleteDescription', {
                    defaultValue: '{{from}}_{{to}} = {{rate}} will be removed for {{date}}.',
                    from: rate.fromCurrency,
                    to: rate.toCurrency,
                    rate: formatRate(rate.rate),
                    date: formatDate(rate.effectiveDate),
                }),
                confirmLabel: t('actions.delete', { defaultValue: 'Delete' }),
                variant: 'danger',
            })
        ) {
            deleteMutation.mutate(rate.id);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) {
            return t('common.notAvailable', { defaultValue: 'N/A' });
        }

        return new Date(dateString).toLocaleDateString(locale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (!currentHotel) {
        return null;
    }

    return (
        <div className="space-y-6">
            <section className="premium-surface p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-brand-mint/12 p-3 text-brand-mint">
                            <ArrowRightLeft size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                {t('pages.exchangeRates.configuration.eyebrow', { defaultValue: 'Configuration' })}
                            </p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                {t('pages.exchangeRates.configuration.title', { defaultValue: 'Currency setup' })}
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                                {t('pages.exchangeRates.helper', {
                                    defaultValue: 'Exchange rates configured here are used in contract preview, PDF export, and pricing simulations.',
                                })}
                            </p>
                        </div>
                    </div>

                    {isAdminOrCommercial && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingRate(null);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                        >
                            <Plus size={16} />
                            {t('pages.exchangeRates.addRate', { defaultValue: 'Add rate' })}
                        </button>
                    )}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="rounded-lg border border-brand-light/70 bg-brand-light/65 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                            {t('pages.exchangeRates.configuration.baseCurrency', { defaultValue: 'Base currency' })}
                        </p>
                        <p className="mt-3 font-mono text-2xl font-black text-brand-navy dark:text-brand-light">
                            {currentHotel.defaultCurrency}
                        </p>
                    </div>
                    <div className="rounded-lg border border-brand-light/70 bg-brand-light/65 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                            {t('pages.exchangeRates.configuration.supportedCurrencies', { defaultValue: 'Supported currencies' })}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {supportedCurrencies.length > 0 ? supportedCurrencies.map((currency) => (
                                <span key={currency} className="inline-flex rounded-lg border border-brand-mint/20 bg-brand-mint/8 px-3 py-1 font-mono text-xs font-black text-brand-mint">
                                    {currency}
                                </span>
                            )) : (
                                <span className="text-sm text-brand-slate">
                                    {t('pages.exchangeRates.configuration.noCurrencies', { defaultValue: 'No currencies configured yet.' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="premium-surface overflow-hidden p-6">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-brand-mint/12 p-3 text-brand-mint">
                        <Coins size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.exchangeRates.table.eyebrow', { defaultValue: 'Exchange Rate Table' })}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            {t('pages.exchangeRates.table.title', { defaultValue: 'Active currency pairs' })}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {t('pages.exchangeRates.convention', { defaultValue: 'AAA_BBB = x means 1 AAA = x BBB.' })}
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex h-36 items-center justify-center rounded-lg border border-brand-light/70 bg-brand-light/55 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                        </div>
                    ) : rates.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-brand-light/70 bg-brand-light/40 px-6 py-12 text-center dark:border-brand-light/10 dark:bg-brand-light/5">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint">
                                <Coins size={26} />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-brand-navy dark:text-brand-light">
                                {t('pages.exchangeRates.emptyTitle', { defaultValue: 'No exchange rate configured.' })}
                            </p>
                            <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/75">
                                {t('pages.exchangeRates.emptySubtitle', { defaultValue: 'Add the first pair to enable currency conversion.' })}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-brand-light/70 bg-brand-light/55 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-brand-light/70 text-brand-slate dark:bg-brand-light/5">
                                        <tr>
                                            {[
                                                t('pages.exchangeRates.table.fromCurrency', { defaultValue: 'From currency' }),
                                                t('pages.exchangeRates.table.toCurrency', { defaultValue: 'To currency' }),
                                                t('pages.exchangeRates.table.rate', { defaultValue: 'Rate' }),
                                                t('pages.exchangeRates.table.meaning', { defaultValue: 'Meaning' }),
                                                t('pages.exchangeRates.table.effectiveDate', { defaultValue: 'Effective date' }),
                                                t('pages.exchangeRates.table.source', { defaultValue: 'Source' }),
                                                t('pages.exchangeRates.table.updatedBy', { defaultValue: 'Updated by' }),
                                            ].map((header) => (
                                                <th key={header} className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">
                                                    {header}
                                                </th>
                                            ))}
                                            {isAdminOrCommercial && (
                                                <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">
                                                    {t('pages.exchangeRates.table.actions', { defaultValue: 'Actions' })}
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                        {rates.map((rate) => (
                                            <tr key={rate.id} className="bg-brand-light/35 transition hover:bg-brand-light/60 dark:bg-transparent dark:hover:bg-brand-light/5">
                                                <td className="px-5 py-4 align-top">
                                                    <span className="inline-flex h-9 min-w-14 items-center justify-center rounded-lg bg-brand-navy px-3 font-mono text-xs font-bold text-brand-light">
                                                        {rate.fromCurrency}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-top">
                                                    <span className="inline-flex h-9 min-w-14 items-center justify-center rounded-lg border border-brand-mint/20 bg-brand-mint/8 px-3 font-mono text-xs font-bold text-brand-mint">
                                                        {rate.toCurrency}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-top font-mono font-bold text-brand-navy dark:text-brand-light">
                                                    {formatRate(rate.rate)}
                                                </td>
                                                <td className="px-5 py-4 align-top font-mono text-sm text-brand-navy dark:text-brand-light">
                                                    <span className="text-brand-slate">1 {rate.fromCurrency} = </span>
                                                    <span className="font-bold">{formatRate(rate.rate)}</span>
                                                    <span className="text-brand-slate"> {rate.toCurrency}</span>
                                                </td>
                                                <td className="px-5 py-4 align-top text-xs text-brand-slate dark:text-brand-light/75">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={13} className="text-brand-mint" />
                                                        <span>{formatDate(rate.effectiveDate)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-top">
                                                    <span className="premium-pill border-brand-slate/20 bg-brand-light text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                                        {rate.source ?? 'manual'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-top text-xs font-semibold text-brand-slate dark:text-brand-light/75">
                                                    {rate.updatedBy || t('common.notAvailable', { defaultValue: 'N/A' })}
                                                </td>
                                                {isAdminOrCommercial && (
                                                    <td className="px-5 py-4 align-top text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingRate(rate);
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-light/70 bg-brand-light/70 text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                                aria-label={t('actions.edit', { defaultValue: 'Edit' })}
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(rate)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-slate/30 bg-brand-slate/10 text-brand-slate transition hover:bg-brand-slate/10 dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75"
                                                                aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <EditExchangeRateModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    editing={editingRate}
                    onSubmit={editingRate ? handleUpdate : handleCreate}
                    isPending={createMutation.isPending || updateMutation.isPending}
                />
            </section>
        </div>
    );
}
