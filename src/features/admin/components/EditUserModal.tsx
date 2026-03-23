import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateUser, type UserListItem } from '../hooks/useUsers';
import type { Hotel } from '../../hotel/services/hotel.service';
import Modal from '../../../components/ui/Modal';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserListItem | null;
    allHotels: Hotel[];
}

interface EditUserForm {
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'COMMERCIAL';
    hotelIds: number[];
}

export default function EditUserModal({ isOpen, onClose, user, allHotels }: EditUserModalProps) {
    const { register, handleSubmit, reset, watch, setValue } = useForm<EditUserForm>({
        defaultValues: {
            firstName: '',
            lastName: '',
            role: 'COMMERCIAL',
            hotelIds: [],
        },
    });

    const selectedRole = watch('role');

    // Sync form state when the user prop changes (different user selected)
    useEffect(() => {
        if (user) {
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                role: user.role as EditUserForm['role'],
                hotelIds: user.hotels ? user.hotels.map(h => h.id) : [],
            });
        }
    }, [user, reset]);

    // Clean form state when modal closes
    useEffect(() => {
        if (!isOpen) {
            reset({
                firstName: '',
                lastName: '',
                role: 'COMMERCIAL',
                hotelIds: [],
            });
        }
    }, [isOpen, reset]);

    // When role changes to ADMIN, clear hotelIds
    useEffect(() => {
        if (selectedRole === 'ADMIN') {
            setValue('hotelIds', []);
        }
    }, [selectedRole, setValue]);

    const updateMutation = useUpdateUser(onClose);

    const onSubmit = (data: EditUserForm) => {
        if (!user) return;
        updateMutation.mutate({
            id: user.id,
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                // Only send hotelIds for COMMERCIAL
                hotelIds: data.role === 'COMMERCIAL' ? data.hotelIds : [],
            },
        });
    };

    // Controlled checkbox logic: watch the array and toggle via setValue
    const selectedHotelIds = watch('hotelIds');

    const toggleHotel = (hotelId: number) => {
        const current = selectedHotelIds ?? [];
        const next = current.includes(hotelId)
            ? current.filter(id => id !== hotelId)
            : [...current, hotelId];
        setValue('hotelIds', next, { shouldDirty: true });
    };

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Modifier ${user.email}`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Identity — disabled if user hasn't accepted invite yet */}
                {!user.isActive && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                        Cet utilisateur n'a pas encore activé son compte. Le nom et prénom seront renseignés lors de l'acceptation de l'invitation.
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                        {...register('firstName')}
                        disabled={!user.isActive}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${!user.isActive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                        {...register('lastName')}
                        disabled={!user.isActive}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${!user.isActive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                    />
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                    <select
                        {...register('role')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                    >
                        <option value="ADMIN">Administrateur</option>
                        <option value="COMMERCIAL">Commercial</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                        {selectedRole === 'ADMIN'
                            ? 'Accès global à la plateforme (pas d\'hôtel requis)'
                            : 'Employé local — doit être affecté à un hôtel'}
                    </p>
                </div>

                {/* Hotels Assignment — Controlled checkboxes, visible only for COMMERCIAL */}
                {selectedRole === 'COMMERCIAL' && allHotels && allHotels.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hôtels assignés *</label>
                        <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                            {allHotels.map((hotel) => (
                                <label key={hotel.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedHotelIds?.includes(hotel.id) ?? false}
                                        onChange={() => toggleHotel(hotel.id)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {hotel.name}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" disabled={updateMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                        {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
