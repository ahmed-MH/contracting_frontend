import { useState } from 'react';
import type { Contract } from '../../types/contract.types';
import { useAddPeriod, useDeletePeriod } from '../../hooks/useContracts';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import CreatePeriodModal from '../modals/CreatePeriodModal';
import { useTranslation } from 'react-i18next';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
    contract: Contract;
}

export default function PeriodsSection({ contract }: Props) {
    const { t } = useTranslation('common');
    void t;
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
        <div className="bg-white shadow-sm ring-1 ring-brand-mint sm:rounded-xl p-6">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-slate/20">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">{t('auto.features.contracts.details.sections.periodssection.42fbd655', { defaultValue: "Saisons &amp; Périodes" })}</h2>
                    <span className="text-xs text-brand-slate">({periods.length})</span>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer">
                    <Plus size={16} /> Nouvelle Période
                </button>
            </div>

            {/* ─── Empty State ────────────────────────────────────────── */}
            {periods.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Calendar size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.contracts.details.sections.periodssection.18942c2c', { defaultValue: "Aucune période définie pour le moment" })}</p>
                    <p className="text-brand-slate text-xs mt-1">{t('auto.features.contracts.details.sections.periodssection.170ff15c', { defaultValue: "Cliquez sur « Nouvelle Période » pour commencer" })}</p>
                </div>
            )}

            {/* ─── Table ──────────────────────────────────────────────── */}
            {periods.length > 0 && (
                <div className="ring-1 ring-brand-mint sm:rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light border-b border-brand-slate/20">
                                <th className="px-5 py-3 text-left text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.periodssection.34946c4d', { defaultValue: "Nom" })}</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.periodssection.f1789f42', { defaultValue: "Date de début" })}</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.periodssection.dad373ba', { defaultValue: "Date de fin" })}</th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.periodssection.2fdeded1', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {periods.map((p) => (
                                <tr key={p.id} className="hover:bg-brand-light transition-colors">
                                    <td className="px-5 py-3 font-medium text-brand-navy">{p.name}</td>
                                    <td className="px-5 py-3 text-brand-slate">{formatDate(p.startDate)}</td>
                                    <td className="px-5 py-3 text-brand-slate">{formatDate(p.endDate)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => handleDelete(p.id, p.name)}
                                            className="p-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer"
                                            title={t('auto.features.contracts.details.sections.periodssection.title.36aec923', { defaultValue: "Supprimer" })}>
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 text-xs text-brand-slate">
                        {periods.length} période{periods.length > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* ─── Modal ──────────────────────────────────────────────── */}
            {showModal && (
                <CreatePeriodModal
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
