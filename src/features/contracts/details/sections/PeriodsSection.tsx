import { useState } from 'react';
import type { Contract } from '../../types/contract.types';
import { useAddPeriod, useDeletePeriod } from '../../hooks/useContracts';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import PeriodFormModal from '../modals/PeriodFormModal';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
    contract: Contract;
}

export default function PeriodsSection({ contract }: Props) {
    const [showModal, setShowModal] = useState(false);
    const { confirm } = useConfirm();

    const addMutation = useAddPeriod(contract.id, () => setShowModal(false));
    const deleteMutation = useDeletePeriod(contract.id);

    const rawPeriods = contract.periods ?? [];

    // Trier les périodes par date de début croissante
    const periods = [...rawPeriods].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const handleDelete = async (periodId: number, periodName: string) => {
        const ok = await confirm({
            title: 'Supprimer la période',
            description: `Êtes-vous sûr de vouloir supprimer la période "${periodName}" ? Cette action est irréversible.`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (ok) deleteMutation.mutate(periodId);
    };

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Saisons &amp; Périodes</h2>
                    <span className="text-xs text-gray-400">({periods.length})</span>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                    <Plus size={16} /> Nouvelle Période
                </button>
            </div>

            {/* ─── Empty State ────────────────────────────────────────── */}
            {periods.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune période définie pour le moment</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur « Nouvelle Période » pour commencer</p>
                </div>
            )}

            {/* ─── Table ──────────────────────────────────────────────── */}
            {periods.length > 0 && (
                <div className="ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de début</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de fin</th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {periods.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                                    <td className="px-5 py-3 text-gray-600">{formatDate(p.startDate)}</td>
                                    <td className="px-5 py-3 text-gray-600">{formatDate(p.endDate)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => handleDelete(p.id, p.name)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                            title="Supprimer">
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                        {periods.length} période{periods.length > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* ─── Modal ──────────────────────────────────────────────── */}
            {showModal && (
                <PeriodFormModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={(data: { name: string; startDate: string; endDate: string }) => addMutation.mutate({ ...data, contractId: contract.id })}
                    isPending={addMutation.isPending}
                    contractStartDate={contract.startDate}
                    contractEndDate={contract.endDate}
                    existingPeriods={periods}
                    defaultValues={{
                        name: `[Calculé Automatiquement]`,
                        startDate: periods.length > 0
                            ? new Date(new Date(periods[periods.length - 1].endDate).getTime() + 86400000).toISOString()
                            : contract.startDate
                    }}
                />
            )}
        </div>
    );
}
