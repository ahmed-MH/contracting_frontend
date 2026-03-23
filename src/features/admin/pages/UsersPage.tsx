import { useState } from 'react';
import { useUsers, useDeleteUser, type UserListItem } from '../hooks/useUsers';
import { useHotels } from '../../hotel/hooks/useHotels';
import { useConfirm } from '../../../context/ConfirmContext';
import { Users, ShieldCheck, Briefcase, Mail, Plus, Pencil, Trash2 } from 'lucide-react';
import InviteUserModal from '../components/InviteUserModal';
import EditUserModal from '../components/EditUserModal';

export default function UsersPage() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const { confirm } = useConfirm();

    const { data: users, isLoading, isError } = useUsers();
    const { data: allHotels = [] } = useHotels();

    const deleteMutation = useDeleteUser();

    const admins = users?.filter(u => u.role === 'ADMIN') ?? [];
    const commercials = users?.filter(u => u.role === 'COMMERCIAL') ?? [];

    const handleDelete = async (user: UserListItem) => {
        if (await confirm({
            title: `Suspendre l'utilisateur ${user.firstName || user.email} ?`,
            description: "L'utilisateur ne pourra plus accéder à la plateforme via ce compte.",
            confirmLabel: "Suspendre",
            variant: "danger"
        })) {
            deleteMutation.mutate(user.id);
        }
    };

    const StatusBadge = ({ isActive }: { isActive: boolean }) =>
        !isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                En attente
            </span>
        ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Actif
            </span>
        );

    const UserAvatar = ({ user }: { user: UserListItem }) => (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
            </div>
            <div>
                <div className="font-medium text-gray-900">
                    {user.firstName ? `${user.firstName} ${user.lastName}` : '—'}
                </div>
                <div className="text-gray-500 text-xs flex items-center gap-1">
                    <Mail size={12} /> {user.email}
                </div>
            </div>
        </div>
    );

    const ActionButtons = ({ user }: { user: UserListItem }) => (
        <div className="flex items-center justify-end gap-2">
            <button onClick={() => setEditingUser(user)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Modifier">
                <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(user)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Suspendre">
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="text-indigo-600" size={28} />
                        Gestion des Utilisateurs
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Invitez et gérez les comptes utilisateurs</p>
                </div>
                <button
                    onClick={() => { setIsInviteModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                >
                    <Plus size={16} /> Inviter un utilisateur
                </button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                    Impossible de charger les utilisateurs.
                </div>
            )}

            {users && (
                <div className="space-y-8">
                    {/* ─── Administrateurs Système ──────────────────────────── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-violet-100 rounded-lg">
                                <ShieldCheck size={18} className="text-violet-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">Administrateurs Système</h2>
                            <span className="text-xs text-gray-400 ml-1">({admins.length})</span>
                        </div>

                        {admins.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
                                Aucun administrateur
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-violet-50/50 border-b border-gray-200">
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Utilisateur</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Statut</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {admins.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4"><UserAvatar user={user} /></td>
                                                <td className="px-6 py-4"><StatusBadge isActive={user.isActive} /></td>
                                                <td className="px-6 py-4 text-right"><ActionButtons user={user} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ─── Équipe de l'Hôtel (Commerciaux) ─────────────────── */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <Briefcase size={18} className="text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">Équipe de l'Hôtel</h2>
                            <span className="text-xs text-gray-400 ml-1">({commercials.length})</span>
                        </div>

                        {commercials.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
                                Aucun commercial
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-blue-50/50 border-b border-gray-200">
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs w-1/3">Utilisateur</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Hôtels Assignés</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs">Statut</th>
                                            <th className="px-6 py-3.5 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {commercials.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4"><UserAvatar user={user} /></td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    {user.hotels && user.hotels.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.hotels.map(h => (
                                                                <span key={h.id} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-100 truncate max-w-[150px]">
                                                                    {h.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">Aucun hôtel</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4"><StatusBadge isActive={user.isActive} /></td>
                                                <td className="px-6 py-4 text-right"><ActionButtons user={user} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                allHotels={allHotels}
            />
        </div>
    );
}
