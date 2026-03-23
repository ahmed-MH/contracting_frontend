import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../../auth/services/auth.service';
import { hotelService } from '../../hotel/services/hotel.service';
import { useQuery } from '@tanstack/react-query';
import Modal from '../../../components/ui/Modal';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InviteForm {
    email: string;
    role: 'ADMIN' | 'COMMERCIAL';
    hotelIds: number[];
}

export default function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
    const queryClient = useQueryClient();

    const { data: hotels = [] } = useQuery({
        queryKey: ['hotels'],
        queryFn: hotelService.getHotels,
    });

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<InviteForm>({
        defaultValues: { email: '', role: 'COMMERCIAL', hotelIds: [] },
    });

    const selectedRole = watch('role');

    const inviteMutation = useMutation({
        mutationFn: (data: InviteForm) => authService.invite({
            email: data.email,
            role: data.role,
            // Only send hotelIds for COMMERCIAL
            hotelIds: data.role === 'COMMERCIAL' ? data.hotelIds.map(Number) : [],
        }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(result.message);
            onClose();
            reset();
        },
        onError: () => { }
    });

    const onSubmit = (data: InviteForm) => {
        inviteMutation.mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inviter un utilisateur">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                        type="email"
                        {...register('email', { required: 'Email requis' })}
                        placeholder="nouveau@exemple.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

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

                {/* Hôtels — visible only for COMMERCIAL */}
                {selectedRole === 'COMMERCIAL' && hotels && hotels.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hôtels assignés *</label>
                        <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                            {hotels.map((hotel) => (
                                <label key={hotel.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={hotel.id}
                                        {...register('hotelIds', {
                                            validate: (v) => selectedRole !== 'COMMERCIAL' || v.length > 0 || 'Au moins un hôtel requis'
                                        })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {hotel.name}
                                </label>
                            ))}
                        </div>
                        {errors.hotelIds && <p className="text-red-500 text-xs mt-1">{errors.hotelIds.message}</p>}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" disabled={inviteMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                        {inviteMutation.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
