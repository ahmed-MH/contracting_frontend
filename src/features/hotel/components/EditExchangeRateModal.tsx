import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Coins, Calendar, Banknote } from 'lucide-react';
import type { ExchangeRate, CreateExchangeRatePayload } from '../types/exchange-rate.types';
import { useHotel } from '../context/HotelContext';
import { CURRENCIES } from '../../../constants/currencies';
import { useTranslation } from 'react-i18next';
import { createExchangeRateSchema, type ExchangeRateFormInput, type ExchangeRateFormValues } from '../schemas/exchange-rate.schema';

interface EditExchangeRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: ExchangeRate | null;
    onSubmit: (data: CreateExchangeRatePayload) => void;
    isPending: boolean;
}

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

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ExchangeRateFormInput, unknown, ExchangeRateFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            currency: '',
            rate: 0,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: null,
        },
    });

    useEffect(() => {
        if (!isOpen) return;

        if (editing) {
            reset({
                currency: editing.currency,
                rate: editing.rate,
                validFrom: editing.validFrom ? new Date(editing.validFrom).toISOString().split('T')[0] : '',
                validUntil: editing.validUntil ? new Date(editing.validUntil).toISOString().split('T')[0] : null,
            });
        } else {
            reset({
                currency: '',
                rate: 0,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: null,
            });
        }
    }, [isOpen, editing, reset]);

    if (!isOpen) return null;

    const inputCls = 'w-full h-10 pl-10 pr-4 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint transition-all font-bold font-mono tracking-widest outline-none text-brand-navy dark:text-brand-light';
    const labelCls = 'block text-xs font-bold text-brand-navy dark:text-brand-light uppercase tracking-wider mb-1.5';
    const iconCls = 'absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-slate';

    const handleValidSubmit = (data: ExchangeRateFormValues) => {
        onSubmit({
            currency: data.currency,
            rate: data.rate,
            validFrom: data.validFrom,
            validUntil: data.validUntil || null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-brand-navy border border-transparent dark:border-brand-slate/20 rounded-2xl shadow-md w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-brand-slate/15 dark:border-brand-slate/20 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-navy dark:text-brand-light flex items-center gap-2">
                        <Banknote className="text-brand-mint" size={22} />
                        {editing
                            ? t('pages.exchangeRates.modal.editTitle', { defaultValue: 'Edit rate' })
                            : t('pages.exchangeRates.modal.createTitle', { defaultValue: 'New exchange rate' })}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20 rounded-full text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer border-none outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(handleValidSubmit)} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>{t('fields.targetCurrency', { defaultValue: 'Target currency' })} *</label>
                                <div className="relative">
                                    <div className={iconCls}><Coins size={15} /></div>
                                    <select {...register('currency')} className={`${inputCls} cursor-pointer appearance-none`}>
                                        <option value="">{t('actions.select', { defaultValue: 'Select' })}</option>
                                        {CURRENCIES.map((currency) => (
                                            <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.currency && <p className="mt-1.5 text-xs text-brand-slate font-medium">{errors.currency.message}</p>}
                            </div>

                            <div>
                                <label className={labelCls}>{t('fields.exchangeRate', { defaultValue: 'Exchange rate' })} *</label>
                                <div className="relative">
                                    <div className={`${iconCls} font-mono text-sm`}>=</div>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        {...register('rate', { valueAsNumber: true })}
                                        className={`${inputCls} pr-16`}
                                        placeholder="3.3500"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-mint font-bold text-xs">
                                        {currentHotel?.defaultCurrency}
                                    </div>
                                </div>
                                {errors.rate && <p className="mt-1.5 text-xs text-brand-slate font-medium">{errors.rate.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelCls}>{t('fields.validFrom', { defaultValue: 'Valid from' })} *</label>
                                    <div className="relative">
                                        <div className={iconCls}><Calendar size={15} /></div>
                                        <input type="date" {...register('validFrom')} className={inputCls} />
                                    </div>
                                    {errors.validFrom && <p className="mt-1 text-xs text-brand-slate">{errors.validFrom.message}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>{t('fields.validUntil', { defaultValue: 'Valid until' })}</label>
                                    <div className="relative">
                                        <div className={iconCls}><Calendar size={15} /></div>
                                        <input type="date" {...register('validUntil')} className={inputCls} />
                                    </div>
                                    {errors.validUntil && <p className="mt-1 text-xs text-brand-slate">{errors.validUntil.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-brand-slate/15 dark:border-brand-slate/20 bg-brand-light/50 dark:bg-brand-navy/50 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light bg-brand-slate/10 hover:bg-brand-slate/20 rounded-xl transition-colors cursor-pointer outline-none border-none"
                        >
                            {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-mint text-white text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-colors shadow-md shadow-brand-mint/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none border-none"
                        >
                            {isPending ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Save size={16} />}
                            {t('actions.save', { defaultValue: 'Save' })}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
