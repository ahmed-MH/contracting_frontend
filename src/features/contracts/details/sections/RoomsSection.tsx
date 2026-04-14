import { useState } from 'react';
import type { Contract } from '../../types/contract.types';
import { useDeleteContractRoom } from '../../hooks/useContracts';
import { useConfirm } from '../../../../context/ConfirmContext';
import { BedDouble, Plus, Trash2 } from 'lucide-react';
import ImportContractRoomsModal from '../modals/ImportContractRoomsModal';
import { useTranslation } from 'react-i18next';

interface Props {
    contract: Contract;
}

export default function RoomsSection({ contract }: Props) {
    const { t } = useTranslation('common');
    void t;
    const [showImport, setShowImport] = useState(false);
    const { confirm } = useConfirm();

    const deleteMutation = useDeleteContractRoom(contract.id);
    const rooms = contract.contractRooms ?? [];

    const handleRemove = async (roomId: number, roomName: string) => {
        const ok = await confirm({
            title: 'Retirer la chambre',
            description: `Retirer "${roomName}" de ce contrat ? Les données associées seront également supprimées.`,
            confirmLabel: 'Retirer',
            variant: 'danger',
        });
        if (ok) deleteMutation.mutate(roomId);
    };

    return (
        <div id="rooms" className="scroll-mt-36 bg-brand-light shadow-sm ring-1 ring-brand-mint sm:rounded-xl p-6">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-slate/20">
                <div className="flex items-center gap-3">
                    <BedDouble size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">{t('auto.features.contracts.details.sections.roomssection.151ee688', { defaultValue: "Chambres du Contrat" })}</h2>
                    <span className="text-xs text-brand-slate">({rooms.length})</span>
                </div>
                <button onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-light bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer">
                    <Plus size={16} /> Ajouter des chambres
                </button>
            </div>

            {/* ─── Empty State ────────────────────────────────────────── */}
            {rooms.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.contracts.details.sections.roomssection.dac67c0a', { defaultValue: "Aucune chambre associée à ce contrat" })}</p>
                    <p className="text-brand-slate text-xs mt-1">{t('auto.features.contracts.details.sections.roomssection.836d12a6', { defaultValue: "Cliquez sur « Ajouter des chambres » pour importer depuis le catalogue" })}</p>
                </div>
            )}

            {/* ─── Table ──────────────────────────────────────────────── */}
            {rooms.length > 0 && (
                <div className="ring-1 ring-brand-mint sm:rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light border-b border-brand-slate/20">
                                <th className="px-5 py-3 text-left text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.roomssection.700dda3b', { defaultValue: "Chambre" })}</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.roomssection.297d0b87', { defaultValue: "Code" })}</th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.roomssection.91bb73ca', { defaultValue: "Adultes" })}</th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.roomssection.065eee1d', { defaultValue: "Enfants" })}</th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.roomssection.588767e1', { defaultValue: "Occupancy Max" })}</th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-brand-slate uppercase tracking-wider">{t('auto.features.contracts.details.sections.roomssection.ab4ecccf', { defaultValue: "Actions" })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {rooms.map((cr) => (
                                <tr key={cr.id} className="hover:bg-brand-light transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-brand-navy">{cr.roomType?.name ?? `Chambre #${cr.id}`}</span>
                                            <span className="text-xs text-brand-slate mt-0.5 font-mono tracking-wide">{cr.reference || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-mint/10 text-brand-mint text-xs font-bold tracking-wide">
                                            {cr.roomType?.code ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-brand-slate">{cr.roomType?.minAdults}–{cr.roomType?.maxAdults}</td>
                                    <td className="px-5 py-3 text-center text-brand-slate">{cr.roomType?.minChildren}–{cr.roomType?.maxChildren}</td>
                                    <td className="px-5 py-3 text-center text-brand-slate">{cr.roomType?.maxOccupancy ?? '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => handleRemove(cr.id, cr.roomType?.name ?? 'chambre')}
                                            className="p-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer"
                                            title={t('auto.features.contracts.details.sections.roomssection.title.4ea386bc', { defaultValue: "Retirer du contrat" })}>
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 text-xs text-brand-slate">
                        {rooms.length} chambre{rooms.length > 1 ? 's' : ''} dans le contrat
                    </div>
                </div>
            )}

            {/* ─── Import Modal ───────────────────────────────────────── */}
            <ImportContractRoomsModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                contractId={contract.id}
                existingRoomTypeIds={rooms.map((cr) => cr.roomType?.id).filter(Boolean) as number[]}
            />
        </div>
    );
}
