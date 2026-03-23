import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Coins, Calendar, Banknote } from 'lucide-react';
import type { ExchangeRate, CreateExchangeRatePayload } from '../types/exchange-rate.types';
import { useHotel } from '../context/HotelContext';
import { CURRENCIES } from '../../../constants/currencies';

interface ExchangeRateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: ExchangeRate | null;
    onSubmit: (data: CreateExchangeRatePayload) => void;
    isPending: boolean;
}

export default function ExchangeRateModal({
    isOpen,
    onClose,
    editing,
    onSubmit,
    isPending,
}: ExchangeRateModalProps) {
    const { currentHotel } = useHotel();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

    useEffect(() => {
        if (isOpen) {
            if (editing) {
                reset({
                    currency: editing.currency,
                    rate: editing.rate,
                    validFrom: editing.validFrom ? new Date(editing.validFrom).toISOString().split('T')[0] : '',
                    validUntil: editing.validUntil ? new Date(editing.validUntil).toISOString().split('T')[0] : '',
                });
            } else {
                reset({
                    currency: '',
                    rate: '',
                    validFrom: new Date().toISOString().split('T')[0],
                    validUntil: '',
                });
            }
        }
    }, [isOpen, editing, reset]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
                {/* ── Header ────────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Banknote className="text-indigo-600" size={24} />
                        {editing ? 'Modifier le Taux' : 'Nouveau Taux de Change'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Scrollable Form Body ─────────────────────────── */}
                <form onSubmit={handleSubmit((data) => {
                    const payload: CreateExchangeRatePayload = {
                        currency: data.currency,
                        rate: Number(data.rate),
                        validFrom: data.validFrom,
                        validUntil: data.validUntil || null,
                    };
                    onSubmit(payload);
                })} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Devise cible *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Coins size={15} />
                                    </div>
                                    <select
                                        {...register('currency', { required: 'La devise est requise' })}
                                        className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold font-mono tracking-widest cursor-pointer appearance-none"
                                    >
                                        <option value="">— Sélectionner —</option>
                                        {CURRENCIES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} - {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.currency && (
                                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
                                        {errors.currency.message as string}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Taux de change *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono text-sm">
                                        =
                                    </div>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        {...register('rate', { required: 'Le taux est requis', min: 0.0001 })}
                                        className="w-full h-10 pl-10 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 font-mono"
                                        placeholder="3.3500"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-xs">
                                        {currentHotel?.defaultCurrency}
                                    </div>
                                </div>
                                {errors.rate && (
                                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
                                        {errors.rate.message as string}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Valide à partir du *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Calendar size={15} />
                                        </div>
                                        <input
                                            type="date"
                                            {...register('validFrom', { required: 'Date requise' })}
                                            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                                        />
                                    </div>
                                    {errors.validFrom && <p className="mt-1 text-xs text-red-500">{errors.validFrom.message as string}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Valide jusqu'au
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <Calendar size={15} />
                                        </div>
                                        <input
                                            type="date"
                                            {...register('validUntil')}
                                            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── Footer / Actions ─────────────────────────────────── */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer outline-none"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none border-none"
                        >
                            {isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                            ) : (
                                <Save size={16} />
                            )}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
