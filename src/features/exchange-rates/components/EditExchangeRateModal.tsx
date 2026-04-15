import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft, Calendar, Coins, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ExchangeRate, CreateExchangeRatePayload } from '../types/exchange-rate.types';
import { useHotel } from '../../hotel/context/HotelContext';
import { CURRENCIES } from '../../../constants/currencies';
import { createExchangeRateSchema, type ExchangeRateFormInput, type ExchangeRateFormValues } from '../schemas/exchange-rate.schema';
import ModalPortal from '../../../components/ui/ModalPortal';

interface EditExchangeRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: ExchangeRate | null;
    onSubmit: (data: CreateExchangeRatePayload) => void;
    isPending: boolean;
}

const sourceOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'system', label: 'System' },
    { value: 'imported', label: 'Imported' },
] as const;

export default function EditExchangeRateModal({
    isOpen,
    onClose,
    editing,
    onSubmit,
    isPending,
}: EditExchangeRateModalProps) {
    const { t } = useTranslation('common');
    const { currentHotel } = useHotel();
    const schema = useMemo(() => createExchangeRateSchema(t), [t]);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ExchangeRateFormInput, unknown, ExchangeRateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            fromCurrency: '',
            toCurrency: currentHotel?.defaultCurrency ?? '',
            rate: 0,
            effectiveDate: new Date().toISOString().split('T')[0],
            source: 'manual',
        },
    });

    useEffect(() => {
        if (!isOpen) return;

        if (editing) {
            reset({
                fromCurrency: editing.fromCurrency,
                toCurrency: editing.toCurrency,
                rate: editing.rate,
                effectiveDate: editing.effectiveDate ? new Date(editing.effectiveDate).toISOString().split('T')[0] : '',
                source: editing.source ?? 'manual',
            });
        } else {
            reset({
                fromCurrency: '',
                toCurrency: currentHotel?.defaultCurrency ?? '',
                rate: 0,
                effectiveDate: new Date().toISOString().split('T')[0],
                source: 'manual',
            });
        }
    }, [isOpen, editing, reset, currentHotel?.defaultCurrency]);

    if (!isOpen) return null;

    const inputCls = 'h-10 w-full rounded-lg border border-brand-slate/20 bg-brand-light pl-10 pr-4 text-sm font-bold tracking-widest text-brand-navy outline-none transition-all focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/30 dark:bg-brand-slate/10 dark:text-brand-light';
    const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-navy dark:text-brand-light';
    const iconCls = 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-slate';
    const fromCurrency = (watch('fromCurrency') || 'AAA').toUpperCase();
    const toCurrency = (watch('toCurrency') || 'BBB').toUpperCase();
    const rate = Number(watch('rate') || 0);

    const handleValidSubmit = (data: ExchangeRateFormValues) => {
        onSubmit({
            fromCurrency: data.fromCurrency,
            toCurrency: data.toCurrency,
            rate: data.rate,
            effectiveDate: data.effectiveDate,
            source: data.source,
        });
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-navy/55 p-4 backdrop-blur-sm">
                <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-transparent bg-brand-light shadow-md dark:border-brand-slate/20 dark:bg-brand-navy">
                    <div className="flex items-center justify-between border-b border-brand-slate/15 px-6 py-4 dark:border-brand-slate/20">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-brand-navy dark:text-brand-light">
                            <ArrowRightLeft className="text-brand-mint" size={22} />
                            {editing
                                ? t('pages.exchangeRates.modal.editTitle', { defaultValue: 'Edit exchange rate' })
                                : t('pages.exchangeRates.modal.createTitle', { defaultValue: 'New exchange rate' })}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border-none p-2 text-brand-slate outline-none transition-colors hover:bg-brand-slate/10 hover:text-brand-navy dark:hover:bg-brand-slate/20 dark:hover:text-brand-light"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(handleValidSubmit)} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelCls}>{t('pages.exchangeRates.fields.fromCurrency', { defaultValue: 'From currency' })} *</label>
                                    <div className="relative">
                                        <div className={iconCls}><Coins size={15} /></div>
                                        <select {...register('fromCurrency')} className={`${inputCls} cursor-pointer appearance-none font-mono`}>
                                            <option value="">{t('actions.select', { defaultValue: 'Select' })}</option>
                                            {CURRENCIES.map((currency) => (
                                                <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.fromCurrency && <p className="mt-1.5 text-xs font-medium text-brand-slate">{errors.fromCurrency.message}</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>{t('pages.exchangeRates.fields.toCurrency', { defaultValue: 'To currency' })} *</label>
                                    <div className="relative">
                                        <div className={iconCls}><Coins size={15} /></div>
                                        <select {...register('toCurrency')} className={`${inputCls} cursor-pointer appearance-none font-mono`}>
                                            <option value="">{t('actions.select', { defaultValue: 'Select' })}</option>
                                            {CURRENCIES.map((currency) => (
                                                <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.toCurrency && <p className="mt-1.5 text-xs font-medium text-brand-slate">{errors.toCurrency.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label className={labelCls}>{t('pages.exchangeRates.fields.rate', { defaultValue: 'Rate' })} *</label>
                                    <div className="relative">
                                        <div className={`${iconCls} font-mono text-sm`}>=</div>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            {...register('rate', { valueAsNumber: true })}
                                            className={`${inputCls} font-mono`}
                                            placeholder="3.100000"
                                        />
                                    </div>
                                    {errors.rate && <p className="mt-1.5 text-xs font-medium text-brand-slate">{errors.rate.message}</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>{t('pages.exchangeRates.fields.effectiveDate', { defaultValue: 'Effective date' })} *</label>
                                    <div className="relative">
                                        <div className={iconCls}><Calendar size={15} /></div>
                                        <input type="date" {...register('effectiveDate')} className={inputCls} />
                                    </div>
                                    {errors.effectiveDate && <p className="mt-1 text-xs text-brand-slate">{errors.effectiveDate.message}</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>{t('pages.exchangeRates.fields.source', { defaultValue: 'Source' })}</label>
                                    <select {...register('source')} className="h-10 w-full cursor-pointer rounded-lg border border-brand-slate/20 bg-brand-light px-3 text-sm font-bold text-brand-navy outline-none transition-all focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/30 dark:bg-brand-slate/10 dark:text-brand-light">
                                        {sourceOptions.map((source) => (
                                            <option key={source.value} value={source.value}>{source.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="rounded-lg border border-brand-mint/20 bg-brand-mint/8 px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-mint">
                                    {t('pages.exchangeRates.modal.meaningLabel', { defaultValue: 'Meaning' })}
                                </p>
                                <p className="mt-2 font-mono text-sm font-bold text-brand-navy dark:text-brand-light">
                                    1 {fromCurrency} = {Number.isFinite(rate) && rate > 0 ? rate.toFixed(6) : 'x'} {toCurrency}
                                </p>
                                <p className="mt-1 text-xs font-medium text-brand-slate dark:text-brand-light/70">
                                    {fromCurrency}_{toCurrency} = x {t('pages.exchangeRates.modal.rule', { defaultValue: 'means 1 from-currency equals x to-currency.' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 justify-end gap-3 border-t border-brand-slate/15 bg-brand-light/50 px-6 py-4 dark:border-brand-slate/20 dark:bg-brand-navy/50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border-none bg-brand-slate/10 px-5 py-2.5 text-sm font-bold text-brand-slate outline-none transition-colors hover:bg-brand-slate/20 hover:text-brand-navy dark:hover:text-brand-light"
                            >
                                {t('actions.cancel', { defaultValue: 'Cancel' })}
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex items-center gap-2 rounded-lg border-none bg-brand-mint px-6 py-2.5 text-sm font-bold text-brand-light shadow-md shadow-brand-mint/20 outline-none transition-colors hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-light/20 border-t-brand-light" /> : <Save size={16} />}
                                {t('actions.save', { defaultValue: 'Save' })}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalPortal>
    );
}
