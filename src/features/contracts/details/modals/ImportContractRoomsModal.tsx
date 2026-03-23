import { useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import { useRoomTypes } from '../../../rooms/hooks/useRoomTypes';
import { useAddContractRoom } from '../../hooks/useContracts';
import { BedDouble } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contractId: number;
    existingRoomTypeIds: number[];
}

export default function ImportContractRoomsModal({ isOpen, onClose, contractId, existingRoomTypeIds }: Props) {
    const { data: allRoomTypes, isLoading } = useRoomTypes();
    const addMutation = useAddContractRoom(contractId, onClose);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // Filter out already-added room types
    const available = allRoomTypes?.filter((rt) => !existingRoomTypeIds.includes(rt.id)) ?? [];

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleImport = async () => {
        // Import selected rooms sequentially
        for (const roomTypeId of selected) {
            await addMutation.mutateAsync({
                contractId,
                roomTypeId,
            });
        }
        setSelected(new Set());
    };

    const handleClose = () => {
        setSelected(new Set());
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importer des chambres" maxWidth="max-w-lg">
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {!isLoading && available.length === 0 && (
                <div className="text-center py-8">
                    <BedDouble size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Toutes les chambres du catalogue sont déjà ajoutées à ce contrat.</p>
                </div>
            )}

            {!isLoading && available.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-3">
                        Sélectionnez les chambres à ajouter au contrat :
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                        {available.map((rt) => (
                            <label key={rt.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selected.has(rt.id)}
                                    onChange={() => toggle(rt.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{rt.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {rt.code} — Max {rt.maxOccupancy} pers. ({rt.maxAdults} ad. / {rt.maxChildren} enf.)
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer — Golden Standard */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    Annuler
                </button>
                <button
                    onClick={handleImport}
                    disabled={selected.size === 0 || addMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {addMutation.isPending
                        ? 'Import en cours...'
                        : `Importer ${selected.size > 0 ? `(${selected.size})` : ''}`}
                </button>
            </div>
        </Modal>
    );
}
