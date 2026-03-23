import { useState } from 'react';
import { Plus, Pencil, Trash2, Calendar, Coins, TrendingUp } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useHotel } from '../context/HotelContext';
import { useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate, useDeleteExchangeRate } from '../hooks/useExchangeRates';
import type { ExchangeRate, CreateExchangeRatePayload, UpdateExchangeRatePayload } from '../types/exchange-rate.types';
import ExchangeRateModal from './ExchangeRateModal';

export default function ExchangeRatesSection() {
    const { currentHotel } = useHotel();
    const { user } = useAuth();
    const { confirm } = useConfirm();
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
                title: 'Supprimer ce taux de change ?',
                description: `Êtes-vous sûr de vouloir supprimer le taux 1 ${rate.currency} = ${rate.rate} ${currentHotel?.defaultCurrency} ?`,
                confirmLabel: 'Supprimer',
                variant: 'danger',
            })
        ) {
            deleteMutation.mutate(rate.id);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!currentHotel) return null;

    return (
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Header section */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Taux de Change</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Configurations des taux pour la devise de base ({currentHotel.defaultCurrency})</p>
                    </div>
                </div>
                {isAdminOrCommercial && (
                    <button
                        onClick={() => {
                            setEditingRate(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors border-none outline-none shadow-sm cursor-pointer"
                    >
                        <Plus size={16} /> Ajouter un taux
                    </button>
                )}
            </div>

            {/* Content section */}
            <div className="p-0">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : !rates || rates.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
                            <Coins size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm mb-1">Aucun taux de change configuré.</p>
                        <p className="text-gray-400 text-xs">Veuillez ajouter les taux applicables pour cet hôtel.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 font-black uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Devise</th>
                                    <th className="px-6 py-3 font-medium">Taux (= 1 Devise)</th>
                                    <th className="px-6 py-3 font-medium">Validité</th>
                                    <th className="px-6 py-3 font-medium">Statut</th>
                                    {isAdminOrCommercial && <th className="px-6 py-3 text-right font-medium">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rates.map((rate) => {
                                    const now = new Date();
                                    const vFrom = new Date(rate.validFrom);
                                    const vUntil = rate.validUntil ? new Date(rate.validUntil) : null;
                                    
                                    let status = "EN COURS";
                                    let statusClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                                    
                                    if (vUntil && vUntil < now) {
                                        status = "EXPIRÉ";
                                        statusClass = "bg-gray-100 text-gray-500 border border-gray-200";
                                    } else if (vFrom > now) {
                                        status = "PLANIFIÉ";
                                        statusClass = "bg-amber-50 text-amber-700 border border-amber-100";
                                    }

                                    return (
                                        <tr key={rate.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-black text-gray-700">
                                                        {rate.currency}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2 font-mono text-gray-900">
                                                    <span className="text-gray-400 text-xs">1 {rate.currency} =</span>
                                                    <span className="font-bold">{rate.rate.toFixed(4)}</span>
                                                    <span className="text-gray-400 text-xs">{currentHotel.defaultCurrency}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {formatDate(rate.validFrom)}
                                                    <span className="text-gray-300 mx-1">→</span>
                                                    {formatDate(rate.validUntil)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${statusClass}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            {isAdminOrCommercial && (
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingRate(rate);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rate)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
                )}
            </div>

            <ExchangeRateModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editing={editingRate}
                onSubmit={editingRate ? handleUpdate : handleCreate}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
