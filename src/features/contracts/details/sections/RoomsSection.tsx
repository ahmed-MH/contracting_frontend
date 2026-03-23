import { useState } from 'react';
import type { Contract } from '../../types/contract.types';
import { useDeleteContractRoom } from '../../hooks/useContracts';
import { useConfirm } from '../../../../context/ConfirmContext';
import { BedDouble, Plus, Trash2 } from 'lucide-react';
import ImportContractRoomsModal from '../modals/ImportContractRoomsModal';

interface Props {
    contract: Contract;
}

export default function RoomsSection({ contract }: Props) {
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
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <BedDouble size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Chambres du Contrat</h2>
                    <span className="text-xs text-gray-400">({rooms.length})</span>
                </div>
                <button onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                    <Plus size={16} /> Ajouter des chambres
                </button>
            </div>

            {/* ─── Empty State ────────────────────────────────────────── */}
            {rooms.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune chambre associée à ce contrat</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur « Ajouter des chambres » pour importer depuis le catalogue</p>
                </div>
            )}

            {/* ─── Table ──────────────────────────────────────────────── */}
            {rooms.length > 0 && (
                <div className="ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chambre</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Adultes</th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enfants</th>
                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Max</th>
                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rooms.map((cr) => (
                                <tr key={cr.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{cr.roomType?.name ?? `Chambre #${cr.id}`}</span>
                                            <span className="text-xs text-gray-400 mt-0.5 font-mono tracking-wide">{cr.reference || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide">
                                            {cr.roomType?.code ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-gray-600">{cr.roomType?.minAdults}–{cr.roomType?.maxAdults}</td>
                                    <td className="px-5 py-3 text-center text-gray-600">{cr.roomType?.minChildren}–{cr.roomType?.maxChildren}</td>
                                    <td className="px-5 py-3 text-center text-gray-600">{cr.roomType?.maxOccupancy ?? '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => handleRemove(cr.id, cr.roomType?.name ?? 'chambre')}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                            title="Retirer du contrat">
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
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
