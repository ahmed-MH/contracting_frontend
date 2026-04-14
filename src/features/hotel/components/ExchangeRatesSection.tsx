import { useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Coins, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useHotel } from '../context/HotelContext';
import { useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate, useDeleteExchangeRate } from '../hooks/useExchangeRates';
import type { ExchangeRate, CreateExchangeRatePayload, UpdateExchangeRatePayload } from '../types/exchange-rate.types';
import EditExchangeRateModal from './EditExchangeRateModal';

export default function ExchangeRatesSection() {
    const { currentHotel } = useHotel();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
    const isAdminOrCommercial = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

    const { data: rates, isLoading } = useExchangeRates(currentHotel?.id || 0);

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRate(null);
    };

    const createMutation = useCreateExchangeRate(currentHotel?.id || 0, closeModal);
    const updateMutation = useUpdateExchangeRate(currentHotel?.id || 0, closeModal);
    const deleteMutation = useDeleteExchangeRate(currentHotel?.id || 0);

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
                title: t('pages.hotel.exchangeRates.deleteTitle', { defaultValue: 'Delete this exchange rate?' }),
                description: t('pages.hotel.exchangeRates.deleteDescription', {
                    defaultValue: 'Are you sure you want to delete the rate 1 {{currency}} = {{rate}} {{baseCurrency}}?',
                    currency: rate.currency,
                    rate: rate.rate,
                    baseCurrency: currentHotel?.defaultCurrency,
                }),
                confirmLabel: t('pages.hotel.exchangeRates.deleteConfirm', { defaultValue: 'Delete' }),
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
        <section className="premium-surface overflow-hidden p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-brand-mint/12 p-3 text-brand-mint">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.hotel.exchangeRates.eyebrow', { defaultValue: 'Currency Control' })}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            {t('pages.hotel.exchangeRates.title', { defaultValue: 'Exchange rates' })}
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {t('pages.hotel.exchangeRates.subtitle', {
                                defaultValue: 'Rate configuration for the base currency ({{currency}}).',
                                currency: currentHotel.defaultCurrency,
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
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                    >
                        <Plus size={16} />
                        {t('pages.hotel.exchangeRates.addRate', { defaultValue: 'Add rate' })}
                    </button>
                )}
            </div>

            <div className="mt-6">
                {isLoading ? (
                    <div className="flex h-36 items-center justify-center rounded-2xl border border-brand-light/70 bg-brand-light/55 dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                    </div>
                ) : !rates || rates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/40 px-6 py-12 text-center dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-mint/10 text-brand-mint">
                            <Coins size={26} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {t('pages.hotel.exchangeRates.emptyTitle', { defaultValue: 'No exchange rate configured.' })}
                        </p>
                        <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/75">
                            {t('pages.hotel.exchangeRates.emptySubtitle', { defaultValue: 'Add the rates applicable for this hotel.' })}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-brand-light/70 bg-brand-light/55 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/70 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">
                                            {t('pages.hotel.exchangeRates.table.currency', { defaultValue: 'Currency' })}
                                        </th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">
                                            {t('pages.hotel.exchangeRates.table.rate', { defaultValue: 'Rate' })}
                                        </th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">
                                            {t('pages.hotel.exchangeRates.table.validity', { defaultValue: 'Validity' })}
                                        </th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">
                                            {t('pages.hotel.exchangeRates.table.status', { defaultValue: 'Status' })}
                                        </th>
                                        {isAdminOrCommercial && (
                                            <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">
                                                {t('pages.hotel.exchangeRates.table.actions', { defaultValue: 'Actions' })}
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {rates.map((rate) => {
                                        const now = new Date();
                                        const validFrom = new Date(rate.validFrom);
                                        const validUntil = rate.validUntil ? new Date(rate.validUntil) : null;

                                        let status = t('pages.hotel.exchangeRates.status.current', { defaultValue: 'Current' });
                                        let statusClass = 'border-brand-mint/20 bg-brand-mint/8 text-brand-mint';

                                        if (validUntil && validUntil < now) {
                                            status = t('pages.hotel.exchangeRates.status.expired', { defaultValue: 'Expired' });
                                            statusClass = 'border-brand-slate/20 bg-brand-light text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75';
                                        } else if (validFrom > now) {
                                            status = t('pages.hotel.exchangeRates.status.scheduled', { defaultValue: 'Scheduled' });
                                            statusClass = 'border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75';
                                        }

                                        return (
                                            <tr key={rate.id} className="bg-brand-light/35 transition hover:bg-brand-light/60 dark:bg-transparent dark:hover:bg-brand-light/5">
                                                <td className="px-5 py-4 align-top">
                                                    <span className="inline-flex h-10 min-w-14 items-center justify-center rounded-2xl bg-brand-navy px-3 text-xs font-bold text-brand-light">
                                                        {rate.currency}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-mono text-sm text-brand-navy dark:text-brand-light">
                                                        <span className="text-brand-slate">1 {rate.currency} = </span>
                                                        <span className="font-bold">{rate.rate.toFixed(4)}</span>
                                                        <span className="text-brand-slate"> {currentHotel.defaultCurrency}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-top text-xs text-brand-slate dark:text-brand-light/75">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Calendar size={13} className="text-brand-mint" />
                                                        <span>{formatDate(rate.validFrom)}</span>
                                                        <span>{t('auto.features.hotel.components.exchangeratessection.a7e8a083', { defaultValue: "to" })}</span>
                                                        <span>{formatDate(rate.validUntil)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-top">
                                                    <span className={`premium-pill ${statusClass}`}>
                                                        {status}
                                                    </span>
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
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-light/70 bg-brand-light/70 text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                                                aria-label={t('actions.edit', { defaultValue: 'Edit' })}
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(rate)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-slate/30 bg-brand-slate/10 text-brand-slate transition hover:bg-brand-slate/10 dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75"
                                                                aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
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
    );
}
