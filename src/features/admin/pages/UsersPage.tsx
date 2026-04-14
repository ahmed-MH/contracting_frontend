import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
    Briefcase,
    Building2,
    Mail,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminSectionCard from '../components/AdminSectionCard';
import InviteUserModal from '../components/InviteUserModal';
import EditUserModal from '../components/EditUserModal';
import { useUsers, useDeleteUser, type UserListItem } from '../hooks/useUsers';
import { useHotels } from '../../hotel/hooks/useHotels';
import { useConfirm } from '../../../context/ConfirmContext';

function StatusBadge({ isActive }: { isActive: boolean }) {
    const { t } = useTranslation('common');

    return isActive ? (
        <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">{t('auto.features.admin.pages.userspage.111a62e5', { defaultValue: "Active" })}</span>
    ) : (
        <span className="premium-pill border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">{t('auto.features.admin.pages.userspage.ed1a9226', { defaultValue: "Pending invite" })}</span>
    );
}

function RoleBadge({ role }: { role: UserListItem['role'] }) {
    const isAdmin = role === 'ADMIN';
    return (
        <span
            className={clsx(
                'premium-pill',
                isAdmin
                    ? 'border-brand-navy/10 bg-brand-navy text-brand-light dark:border-brand-light/10 dark:bg-brand-light/8 dark:text-brand-light'
                    : 'border-brand-mint/30 bg-brand-mint/10 text-brand-mint dark:border-brand-mint/30 dark:bg-brand-mint/20 dark:text-brand-light/75',
            )}
        >
            {isAdmin ? 'Admin' : 'Commercial'}
        </span>
    );
}

function UserAvatar({ user }: { user: UserListItem }) {
    const initials = user.firstName
        ? `${user.firstName[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim()
        : user.email.slice(0, 2).toUpperCase();

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint/10 text-sm font-semibold text-brand-light shadow-md">
                {initials}
            </div>
            <div className="min-w-0">
                <p className="truncate font-semibold text-brand-navy dark:text-brand-light">
                    {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : 'Profile pending'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-brand-slate dark:text-brand-light/75">
                    <Mail size={12} />
                    <span className="truncate">{user.email}</span>
                </p>
            </div>
        </div>
    );
}

function ActionButtons({
    user,
    onEdit,
    onDelete,
}: {
    user: UserListItem;
    onEdit: (user: UserListItem) => void;
    onDelete: (user: UserListItem) => void;
}) {
    const { t } = useTranslation('common');

    return (
        <div className="flex items-center justify-end gap-2">
            <button
                type="button"
                onClick={() => onEdit(user)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-light/70 bg-brand-light/70 text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                title={t('auto.features.admin.pages.userspage.title.8c6523e0', { defaultValue: "Edit user" })}
            >
                <Pencil size={16} />
            </button>
            <button
                type="button"
                onClick={() => onDelete(user)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-slate/30 bg-brand-slate/10 text-brand-slate transition hover:bg-brand-slate/10 dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75"
                title={t('auto.features.admin.pages.userspage.title.6d534da0', { defaultValue: "Suspend user" })}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}

function UserTable({
    users,
    emptyLabel,
    showHotels,
    onEdit,
    onDelete,
}: {
    users: UserListItem[];
    emptyLabel: string;
    showHotels: boolean;
    onEdit: (user: UserListItem) => void;
    onDelete: (user: UserListItem) => void;
}) {
    const { t } = useTranslation('common');

    if (users.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/40 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                {emptyLabel}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-brand-light/70 bg-brand-light/55 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-brand-light/70 text-brand-slate dark:bg-brand-light/5">
                        <tr>
                            <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{t('auto.features.admin.pages.userspage.a9bbbbe0', { defaultValue: "User" })}</th>
                            <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{t('auto.features.admin.pages.userspage.0d3e32fc', { defaultValue: "Role" })}</th>
                            {showHotels && <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{t('auto.features.admin.pages.userspage.7b43cd72', { defaultValue: "Assigned hotels" })}</th>}
                            <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{t('auto.features.admin.pages.userspage.e63e6e31', { defaultValue: "Status" })}</th>
                            <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">{t('auto.features.admin.pages.userspage.77eb292a', { defaultValue: "Actions" })}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                        {users.map((user) => (
                            <tr key={user.id} className="bg-brand-light/35 dark:bg-transparent">
                                <td className="px-5 py-4 align-top"><UserAvatar user={user} /></td>
                                <td className="px-5 py-4 align-top"><RoleBadge role={user.role} /></td>
                                {showHotels && (
                                    <td className="px-5 py-4 align-top">
                                        {user.hotels && user.hotels.length > 0 ? (
                                            <div className="flex max-w-sm flex-wrap gap-2">
                                                {user.hotels.map((hotel) => (
                                                    <span key={hotel.id} className="inline-flex items-center rounded-full border border-brand-mint/15 bg-brand-mint/8 px-3 py-1 text-xs font-medium text-brand-navy dark:text-brand-light">
                                                        {hotel.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-brand-slate dark:text-brand-light/75">{t('auto.features.admin.pages.userspage.28e3c5ef', { defaultValue: "No hotel assigned" })}</span>
                                        )}
                                    </td>
                                )}
                                <td className="px-5 py-4 align-top"><StatusBadge isActive={user.isActive} /></td>
                                <td className="px-5 py-4 align-top text-right"><ActionButtons user={user} onEdit={onEdit} onDelete={onDelete} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function UsersPage() {
    const { t } = useTranslation('common');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const { confirm } = useConfirm();
    const { data: users, isLoading, isError } = useUsers();
    const { data: allHotels = [] } = useHotels();
    const deleteMutation = useDeleteUser();

    const admins = users?.filter((user) => user.role === 'ADMIN') ?? [];
    const commercials = users?.filter((user) => user.role === 'COMMERCIAL') ?? [];
    const activeUsers = users?.filter((user) => user.isActive).length ?? 0;
    const pendingUsers = (users?.length ?? 0) - activeUsers;
    const assignedHotels = useMemo(() => {
        const hotelIds = commercials.flatMap((user) => user.hotels?.map((hotel) => hotel.id) ?? []);
        return new Set(hotelIds).size;
    }, [commercials]);

    const handleDelete = async (user: UserListItem) => {
        if (await confirm({
            title: t('pages.users.confirmSuspend.title', { defaultValue: 'Suspend {{name}}?', name: user.firstName || user.email }),
            description: t('pages.users.confirmSuspend.description', { defaultValue: 'This account will lose access to the workspace until it is re-enabled.' }),
            confirmLabel: t('pages.users.confirmSuspend.confirmLabel', { defaultValue: 'Suspend user' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(user.id);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <AdminPageHeader
                eyebrow={t('pages.users.header.eyebrow', { defaultValue: 'Team Access' })}
                title={t('pages.users.header.title', { defaultValue: 'Shape who can operate the organization.' })}
                description={t('pages.users.header.subtitle', { defaultValue: 'Invite admins, assign commercial teammates to the right hotels, and keep access hygiene aligned with the portfolio.' })}
                badge={t('pages.users.header.badge', { defaultValue: '{{count}} seats in workspace', count: users?.length ?? 0 })}
                actions={(
                    <button
                        type="button"
                        onClick={() => { setIsInviteModalOpen(true); }}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                    >
                        <Plus size={16} />
                        {t('pages.users.header.inviteUser', { defaultValue: 'Invite user' })}
                    </button>
                )}
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: t('pages.users.metrics.totalSeats', { defaultValue: 'Total seats' }), value: users?.length ?? 0, icon: Users },
                        { label: t('pages.users.metrics.activeUsers', { defaultValue: 'Active users' }), value: activeUsers, icon: ShieldCheck },
                        { label: t('pages.users.metrics.pendingInvites', { defaultValue: 'Pending invites' }), value: pendingUsers, icon: UserCog },
                        { label: t('pages.users.metrics.hotelsCovered', { defaultValue: 'Hotels covered' }), value: assignedHotels, icon: Building2 },
                    ].map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <div key={metric.label} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-medium text-brand-slate">{metric.label}</p>
                                    <div className="rounded-2xl bg-brand-mint/10 p-3 text-brand-mint"><Icon size={18} /></div>
                                </div>
                                <p className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{metric.value}</p>
                            </div>
                        );
                    })}
                </div>
            </AdminPageHeader>

            {isLoading && (
                <div className="premium-surface flex h-48 items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="premium-surface border-brand-slate/30 bg-brand-slate/10 p-6 text-sm text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                    {t('pages.users.errors.loadFailed', { defaultValue: 'Unable to load users right now.' })}
                </div>
            )}

            {users && (
                <div className="space-y-6">
                    <AdminSectionCard
                        eyebrow={t('pages.users.admins.eyebrow', { defaultValue: 'Governance Layer' })}
                        title={t('pages.users.admins.title', { defaultValue: 'Organization admins' })}
                        description={t('pages.users.admins.description', { defaultValue: 'Admins manage billing posture, access rules, and overall workspace governance.' })}
                        actions={(
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-navy/10 bg-brand-navy px-4 py-2 text-sm font-medium text-brand-light dark:border-brand-light/10 dark:bg-brand-light/8">
                                <Briefcase size={16} />
                                {t('pages.users.admins.count', { defaultValue: '{{count}} admin seats', count: admins.length })}
                            </div>
                        )}
                    >
                        <UserTable users={admins} emptyLabel={t('pages.users.admins.empty', { defaultValue: 'No admin seats are active yet.' })} showHotels={false} onEdit={setEditingUser} onDelete={handleDelete} />
                    </AdminSectionCard>

                    <AdminSectionCard
                        eyebrow={t('pages.users.commercials.eyebrow', { defaultValue: 'Portfolio Coverage' })}
                        title={t('pages.users.commercials.title', { defaultValue: 'Commercial team' })}
                        description={t('pages.users.commercials.description', { defaultValue: 'Commercial users work inside the hotel portfolio, so assignments should stay tightly scoped and current.' })}
                        actions={(
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/8 px-4 py-2 text-sm font-medium text-brand-mint">
                                <Building2 size={16} />
                                {t('pages.users.commercials.count', { defaultValue: '{{count}} commercial seats across {{hotels}} hotels', count: commercials.length, hotels: allHotels.length })}
                            </div>
                        )}
                    >
                        <UserTable users={commercials} emptyLabel={t('pages.users.commercials.empty', { defaultValue: 'No commercial users have been assigned yet.' })} showHotels onEdit={setEditingUser} onDelete={handleDelete} />
                    </AdminSectionCard>

                    <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                        <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/10 p-6 shadow-md dark:border-brand-mint/20 dark:bg-brand-navy/80">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate dark:text-brand-light/75">{t('pages.users.guidance.eyebrow', { defaultValue: 'Access Hygiene' })}</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{t('pages.users.guidance.title', { defaultValue: 'Keep assignments clean as the portfolio grows.' })}</h3>
                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                {[
                                    t('pages.users.guidance.items.reviewPending', { defaultValue: 'Review pending invites before opening a new onboarding batch.' }),
                                    t('pages.users.guidance.items.auditAdmins', { defaultValue: 'Limit admin seats to users handling billing and governance decisions.' }),
                                    t('pages.users.guidance.items.alignHotels', { defaultValue: "Match hotel assignments to each commercial user's current operating scope." }),
                                ].map((item) => (
                                    <div key={item} className="rounded-2xl border border-brand-light/60 bg-brand-light/72 px-4 py-3 text-sm text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="premium-surface p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">{t('pages.users.summary.eyebrow', { defaultValue: 'Coverage Snapshot' })}</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{t('pages.users.summary.title', { defaultValue: 'Seat distribution' })}</h3>
                            <div className="mt-5 space-y-4">
                                {[
                                    { label: t('pages.users.summary.adminCoverage', { defaultValue: 'Admin governance' }), value: `${admins.length}/${Math.max(users.length, 1)}` },
                                    { label: t('pages.users.summary.commercialCoverage', { defaultValue: 'Commercial execution' }), value: `${commercials.length}/${Math.max(users.length, 1)}` },
                                    { label: t('pages.users.summary.hotelAssignments', { defaultValue: 'Hotel assignments' }), value: `${assignedHotels}/${Math.max(allHotels.length, 1)}` },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm text-brand-slate dark:text-brand-light/75">{item.label}</p>
                                            <p className="text-lg font-semibold text-brand-navy dark:text-brand-light">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}

            <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
            <EditUserModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} allHotels={allHotels} />
        </div>
    );
}
