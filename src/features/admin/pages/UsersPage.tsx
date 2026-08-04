import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { clsx } from 'clsx';
import {
    Briefcase,
    Building2,
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    UserCheck,
    UserMinus,
    UserCog,
    Users,
    X,
} from 'lucide-react';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminSectionCard from '../components/AdminSectionCard';
import InviteUserModal from '../components/InviteUserModal';
import EditUserModal from '../components/EditUserModal';
import { useUsers, useSuspendUser, useReactivateUser, useRemovePendingInvite, type UserListItem } from '../hooks/useUsers';
import { useHotels } from '../../hotel/hooks/useHotels';
import { useConfirm } from '../../../context/ConfirmContext';
import { useAuth } from '../../auth/context/AuthContext';

type RoleFilter = 'ALL' | 'ADMIN' | 'COMMERCIAL' | 'AGENT';
type AccountStatus = 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
type StatusFilter = 'ALL' | AccountStatus;

function getUserAccountStatus(user: UserListItem): AccountStatus {
    return user.accountStatus ?? (user.isActive ? 'ACTIVE' : 'PENDING_INVITE');
}

function formatTeamCoverage(t: TFunction, count: number, hotels: number, role: 'commercial' | 'agent') {
    const roleLabel = role === 'commercial'
        ? t(count === 1 ? 'pages.users.commercials.unitSingular' : 'pages.users.commercials.unitPlural', {
            defaultValue: count === 1 ? 'commercial user' : 'commercial users',
        })
        : t(count === 1 ? 'pages.users.agents.unitSingular' : 'pages.users.agents.unitPlural', {
            defaultValue: count === 1 ? 'agent' : 'agents',
        });
    const hotelLabel = t(hotels === 1 ? 'pages.users.units.hotelSingular' : 'pages.users.units.hotelPlural', {
        defaultValue: hotels === 1 ? 'hotel' : 'hotels',
    });

    return t('pages.users.teamCoverage', {
        defaultValue: '{{count}} {{roleLabel}} across {{hotels}} {{hotelLabel}}',
        count,
        roleLabel,
        hotels,
        hotelLabel,
    });
}

function MetricSkeletonGrid() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-brand-light/70 bg-brand-light/55 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="h-3 w-28 animate-pulse rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                        <div className="h-11 w-11 shrink-0 rounded-lg bg-brand-mint/10" />
                    </div>
                    <div className="mt-6 h-8 w-14 animate-pulse rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ user }: { user: UserListItem }) {
    const { t } = useTranslation('common');
    const status = getUserAccountStatus(user);

    if (status === 'ACTIVE') {
        return (
        <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">{t('auto.features.admin.pages.userspage.111a62e5', { defaultValue: "Active" })}</span>
        );
    }

    if (status === 'SUSPENDED') {
        return (
            <span className="premium-pill border-brand-slate/35 bg-brand-slate/12 text-brand-navy dark:border-brand-light/15 dark:bg-brand-light/8 dark:text-brand-light">
                {t('pages.users.status.suspended', { defaultValue: 'Suspended' })}
            </span>
        );
    }

    return (
        <span className="premium-pill border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">{t('auto.features.admin.pages.userspage.ed1a9226', { defaultValue: "Pending invite" })}</span>
    );
}

function RoleBadge({ role }: { role: UserListItem['role'] }) {
    const { t } = useTranslation('common');
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
            {isAdmin
                ? t('pages.users.roles.admin', { defaultValue: 'Administrator' })
                : role === 'AGENT'
                    ? t('pages.users.roles.agent', { defaultValue: 'Agent' })
                    : t('pages.users.roles.commercial', { defaultValue: 'Commercial' })}
        </span>
    );
}

function UserAvatar({ user }: { user: UserListItem }) {
    const { t } = useTranslation('common');
    const initials = user.firstName
        ? `${user.firstName[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim()
        : user.email.slice(0, 2).toUpperCase();

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-mint/15 text-sm font-semibold text-brand-mint shadow-sm">
                {initials}
            </div>
            <div className="min-w-0">
                <p className="truncate font-semibold text-brand-navy dark:text-brand-light">
                    {user.firstName
                        ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                        : t('pages.users.status.profilePending', { defaultValue: 'Profile pending' })}
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
    currentUserId,
    onEdit,
    onSuspend,
    onReactivate,
    onRemoveInvite,
    isPending,
}: {
    user: UserListItem;
    currentUserId?: number;
    onEdit: (user: UserListItem) => void;
    onSuspend: (user: UserListItem) => void;
    onReactivate: (user: UserListItem) => void;
    onRemoveInvite: (user: UserListItem) => void;
    isPending?: boolean;
}) {
    const { t } = useTranslation('common');
    const status = getUserAccountStatus(user);
    const isCurrentUser = currentUserId === user.id;
    const suspendTitle = isCurrentUser
        ? t('pages.users.actions.cannotSuspendSelf', { defaultValue: 'You cannot suspend your own account' })
        : t('auto.features.admin.pages.userspage.title.6d534da0', { defaultValue: "Suspend user" });

    return (
        <div className="flex items-center justify-end gap-2">
            <button
                type="button"
                onClick={() => onEdit(user)}
                disabled={isPending}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-light/70 bg-brand-light/70 text-brand-slate transition hover:text-brand-navy disabled:pointer-events-none disabled:opacity-50 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                title={t('auto.features.admin.pages.userspage.title.8c6523e0', { defaultValue: "Edit user" })}
                aria-label={t('auto.features.admin.pages.userspage.title.8c6523e0', { defaultValue: "Edit user" })}
            >
                <Pencil size={16} />
            </button>
            {status === 'ACTIVE' && (
                <button
                    type="button"
                    onClick={() => onSuspend(user)}
                    disabled={isPending || isCurrentUser}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-slate/30 bg-brand-slate/10 text-brand-slate transition hover:border-brand-mint/25 hover:text-brand-navy disabled:pointer-events-none disabled:opacity-50 dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75 dark:hover:text-brand-light"
                    title={suspendTitle}
                    aria-label={suspendTitle}
                >
                    <UserMinus size={16} />
                </button>
            )}
            {status === 'SUSPENDED' && (
                <button
                    type="button"
                    onClick={() => onReactivate(user)}
                    disabled={isPending}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-mint/25 bg-brand-mint/10 text-brand-mint transition hover:bg-brand-mint hover:text-brand-light disabled:pointer-events-none disabled:opacity-50"
                    title={t('pages.users.actions.reactivate', { defaultValue: 'Reactivate user' })}
                    aria-label={t('pages.users.actions.reactivate', { defaultValue: 'Reactivate user' })}
                >
                    <UserCheck size={16} />
                </button>
            )}
            {status === 'PENDING_INVITE' && (
                <button
                    type="button"
                    onClick={() => onRemoveInvite(user)}
                    disabled={isPending}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                    title={t('pages.users.actions.removeInvite', { defaultValue: 'Remove invite' })}
                    aria-label={t('pages.users.actions.removeInvite', { defaultValue: 'Remove invite' })}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

function RosterToolbar({
    searchTerm,
    roleFilter,
    statusFilter,
    hotelFilter,
    allHotels,
    activeFilterCount,
    onSearchChange,
    onRoleChange,
    onStatusChange,
    onHotelChange,
    onReset,
}: {
    searchTerm: string;
    roleFilter: RoleFilter;
    statusFilter: StatusFilter;
    hotelFilter: string;
    allHotels: { id: number; name: string }[];
    activeFilterCount: number;
    onSearchChange: (value: string) => void;
    onRoleChange: (value: RoleFilter) => void;
    onStatusChange: (value: StatusFilter) => void;
    onHotelChange: (value: string) => void;
    onReset: () => void;
}) {
    const { t } = useTranslation('common');
    const selectClassName = 'h-11 rounded-lg border border-brand-light/70 bg-brand-light/75 px-3 text-sm font-medium text-brand-navy outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';

    return (
        <AdminSectionCard
            eyebrow={t('pages.users.filters.eyebrow', { defaultValue: 'Roster Tools' })}
            title={t('pages.users.filters.title', { defaultValue: 'Find the right account quickly' })}
            description={t('pages.users.filters.description', { defaultValue: 'Filter by name, email, role, status, or hotel assignment before editing access.' })}
            actions={activeFilterCount > 0 ? (
                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/75 px-3 text-sm font-semibold text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                >
                    <X size={15} />
                    {t('pages.users.filters.clear', { defaultValue: 'Clear filters' })}
                </button>
            ) : (
                <div className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/8 px-3 text-sm font-medium text-brand-mint">
                    <SlidersHorizontal size={15} />
                    {t('pages.users.filters.ready', { defaultValue: 'Ready to filter' })}
                </div>
            )}
        >
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_minmax(180px,240px)]">
                <label className="relative min-w-0">
                    <span className="sr-only">{t('pages.users.filters.search', { defaultValue: 'Search users' })}</span>
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={t('pages.users.filters.searchPlaceholder', { defaultValue: 'Search name or email' })}
                        className="h-11 w-full rounded-lg border border-brand-light/70 bg-brand-light/75 pl-10 pr-3 text-sm text-brand-navy outline-none transition placeholder:text-brand-slate/70 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </label>

                <select value={roleFilter} onChange={(event) => onRoleChange(event.target.value as RoleFilter)} className={selectClassName}>
                    <option value="ALL">{t('pages.users.filters.roles.all', { defaultValue: 'All roles' })}</option>
                    <option value="ADMIN">{t('pages.users.roles.admin', { defaultValue: 'Administrator' })}</option>
                    <option value="COMMERCIAL">{t('pages.users.roles.commercial', { defaultValue: 'Commercial' })}</option>
                    <option value="AGENT">{t('pages.users.roles.agent', { defaultValue: 'Agent' })}</option>
                </select>

                <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value as StatusFilter)} className={selectClassName}>
                    <option value="ALL">{t('pages.users.filters.status.all', { defaultValue: 'All statuses' })}</option>
                    <option value="ACTIVE">{t('auto.features.admin.pages.userspage.111a62e5', { defaultValue: "Active" })}</option>
                    <option value="PENDING_INVITE">{t('auto.features.admin.pages.userspage.ed1a9226', { defaultValue: "Pending invite" })}</option>
                    <option value="SUSPENDED">{t('pages.users.status.suspended', { defaultValue: 'Suspended' })}</option>
                </select>

                <select value={hotelFilter} onChange={(event) => onHotelChange(event.target.value)} className={selectClassName}>
                    <option value="ALL">{t('pages.users.filters.hotels.all', { defaultValue: 'All hotels' })}</option>
                    {allHotels.map((hotel) => (
                        <option key={hotel.id} value={String(hotel.id)}>{hotel.name}</option>
                    ))}
                </select>
            </div>
        </AdminSectionCard>
    );
}

function UserTable({
    users,
    currentUserId,
    emptyLabel,
    showHotels,
    onEdit,
    onSuspend,
    onReactivate,
    onRemoveInvite,
    isActionPending,
}: {
    users: UserListItem[];
    currentUserId?: number;
    emptyLabel: string;
    showHotels: boolean;
    onEdit: (user: UserListItem) => void;
    onSuspend: (user: UserListItem) => void;
    onReactivate: (user: UserListItem) => void;
    onRemoveInvite: (user: UserListItem) => void;
    isActionPending?: boolean;
}) {
    const { t } = useTranslation('common');

    if (users.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-brand-light/70 bg-brand-light/40 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                {emptyLabel}
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-3 md:hidden">
                {users.map((user) => (
                    <article key={user.id} className="rounded-lg border border-brand-light/70 bg-brand-light/60 p-4 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="flex items-start justify-between gap-3">
                            <UserAvatar user={user} />
                            <ActionButtons user={user} currentUserId={currentUserId} onEdit={onEdit} onSuspend={onSuspend} onReactivate={onReactivate} onRemoveInvite={onRemoveInvite} isPending={isActionPending} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <RoleBadge role={user.role} />
                            <StatusBadge user={user} />
                        </div>
                        {showHotels && (
                            <div className="mt-4 border-t border-brand-light/70 pt-3 dark:border-brand-light/10">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                    {t('auto.features.admin.pages.userspage.7b43cd72', { defaultValue: "Assigned hotels" })}
                                </p>
                                {user.hotels && user.hotels.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {user.hotels.map((hotel) => (
                                            <span key={hotel.id} className="inline-flex items-center rounded-full border border-brand-mint/15 bg-brand-mint/8 px-3 py-1 text-xs font-medium text-brand-navy dark:text-brand-light">
                                                {hotel.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">{t('auto.features.admin.pages.userspage.28e3c5ef', { defaultValue: "No hotel assigned" })}</p>
                                )}
                            </div>
                        )}
                    </article>
                ))}
            </div>

        <div className="hidden overflow-hidden rounded-lg border border-brand-light/70 bg-brand-light/55 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 md:block">
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
                                <td className="px-5 py-4 align-top"><StatusBadge user={user} /></td>
                                <td className="px-5 py-4 align-top text-right"><ActionButtons user={user} currentUserId={currentUserId} onEdit={onEdit} onSuspend={onSuspend} onReactivate={onReactivate} onRemoveInvite={onRemoveInvite} isPending={isActionPending} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        </>
    );
}

export default function UsersPage() {
    const { t } = useTranslation('common');
    const { user: currentUser } = useAuth();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [hotelFilter, setHotelFilter] = useState('ALL');
    const { confirm } = useConfirm();
    const { data: users, isLoading, isError } = useUsers();
    const { data: allHotels = [] } = useHotels();
    const suspendMutation = useSuspendUser();
    const reactivateMutation = useReactivateUser();
    const removeInviteMutation = useRemovePendingInvite();

    const allUsers = users ?? [];
    const admins = allUsers.filter((user) => user.role === 'ADMIN');
    const commercials = allUsers.filter((user) => user.role === 'COMMERCIAL');
    const agents = allUsers.filter((user) => user.role === 'AGENT');
    const activeAdminCount = admins.filter((user) => getUserAccountStatus(user) === 'ACTIVE').length;
    const activeUsers = allUsers.filter((user) => getUserAccountStatus(user) === 'ACTIVE').length;
    const pendingUsers = allUsers.filter((user) => getUserAccountStatus(user) === 'PENDING_INVITE').length;
    const seatUsageLabel = users?.length ?? 0;
    const activeCommercials = commercials.filter((user) => getUserAccountStatus(user) === 'ACTIVE');
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredUsers = useMemo(() => allUsers.filter((user) => {
        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim().toLowerCase();
        const email = user.email.toLowerCase();
        const matchesSearch = normalizedSearch.length === 0 || fullName.includes(normalizedSearch) || email.includes(normalizedSearch);
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'ALL' || getUserAccountStatus(user) === statusFilter;
        const matchesHotel = hotelFilter === 'ALL' || (user.hotels?.some((hotel) => String(hotel.id) === hotelFilter) ?? false);

        return matchesSearch && matchesRole && matchesStatus && matchesHotel;
    }), [allUsers, hotelFilter, normalizedSearch, roleFilter, statusFilter]);
    const filteredAdmins = filteredUsers.filter((user) => user.role === 'ADMIN');
    const filteredCommercials = filteredUsers.filter((user) => user.role === 'COMMERCIAL');
    const filteredAgents = filteredUsers.filter((user) => user.role === 'AGENT');
    const activeFilterCount = Number(normalizedSearch.length > 0)
        + Number(roleFilter !== 'ALL')
        + Number(statusFilter !== 'ALL')
        + Number(hotelFilter !== 'ALL');
    const assignedHotels = useMemo(() => {
        const hotelIds = activeCommercials.flatMap((user) => user.hotels?.map((hotel) => hotel.id) ?? []);
        return new Set(hotelIds).size;
    }, [activeCommercials]);

    const resetFilters = () => {
        setSearchTerm('');
        setRoleFilter('ALL');
        setStatusFilter('ALL');
        setHotelFilter('ALL');
    };

    const handleSuspend = async (user: UserListItem) => {
        if (currentUser?.id === user.id) {
            return;
        }

        if (await confirm({
            title: t('pages.users.confirmSuspend.title', { defaultValue: 'Suspend {{name}}?', name: user.firstName || user.email }),
            description: t('pages.users.confirmSuspend.description', { defaultValue: 'This account will lose access to the workspace until it is re-enabled.' }),
            confirmLabel: t('pages.users.confirmSuspend.confirmLabel', { defaultValue: 'Suspend user' }),
            variant: 'danger',
        })) {
            suspendMutation.mutate(user.id);
        }
    };

    const handleReactivate = async (user: UserListItem) => {
        if (await confirm({
            title: t('pages.users.confirmReactivate.title', { defaultValue: 'Reactivate {{name}}?', name: user.firstName || user.email }),
            description: t('pages.users.confirmReactivate.description', { defaultValue: 'This account will regain access with the same role and hotel assignments.' }),
            confirmLabel: t('pages.users.confirmReactivate.confirmLabel', { defaultValue: 'Reactivate user' }),
        })) {
            reactivateMutation.mutate(user.id);
        }
    };

    const handleRemoveInvite = async (user: UserListItem) => {
        if (await confirm({
            title: t('pages.users.confirmRemoveInvite.title', { defaultValue: 'Remove pending invite?' }),
            description: t('pages.users.confirmRemoveInvite.description', {
                defaultValue: 'Remove this pending invite? The invite link will stop working and the seat will become available.',
            }),
            confirmLabel: t('pages.users.confirmRemoveInvite.confirmLabel', { defaultValue: 'Remove invite' }),
            variant: 'danger',
        })) {
            removeInviteMutation.mutate(user.id);
        }
    };

    const isUserActionPending = suspendMutation.isPending || reactivateMutation.isPending || removeInviteMutation.isPending;

    return (
        <div className="space-y-6 p-4 md:p-6">
            <AdminPageHeader
                eyebrow={t('pages.users.header.eyebrow', { defaultValue: 'Team Access' })}
                title={t('pages.users.header.title', { defaultValue: 'Shape who can operate the organization.' })}
                description={t('pages.users.header.subtitle', { defaultValue: 'Invite admins, assign commercial teammates to the right hotels, and keep access hygiene aligned with the portfolio.' })}
                badge={isLoading
                    ? t('pages.users.header.loadingBadge', { defaultValue: 'Loading roster' })
                    : t('pages.users.header.badge', { defaultValue: '{{count}} seats in workspace', count: users?.length ?? 0 })}
                actions={(
                    <button
                        type="button"
                        onClick={() => { setIsInviteModalOpen(true); }}
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                    >
                        <Plus size={16} />
                        {t('pages.users.header.inviteUser', { defaultValue: 'Invite user' })}
                    </button>
                )}
            >
                {isLoading ? (
                    <MetricSkeletonGrid />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: t('pages.users.metrics.totalSeats', { defaultValue: 'Seats used' }), value: seatUsageLabel, icon: Users },
                            { label: t('pages.users.metrics.activeUsers', { defaultValue: 'Active users' }), value: activeUsers, icon: ShieldCheck },
                            { label: t('pages.users.metrics.pendingInvites', { defaultValue: 'Pending invites' }), value: pendingUsers, icon: UserCog },
                            { label: t('pages.users.metrics.hotelUsage', { defaultValue: 'Hotels managed' }), value: allHotels.length, icon: Building2 },
                        ].map((metric) => {
                            const Icon = metric.icon;
                            return (
                                <div key={metric.label} className="rounded-lg border border-brand-light/70 bg-brand-light/72 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm font-medium text-brand-slate">{metric.label}</p>
                                        <div className="rounded-lg bg-brand-mint/10 p-3 text-brand-mint"><Icon size={18} /></div>
                                    </div>
                                    <p className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{metric.value}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </AdminPageHeader>

            {isLoading && (
                <div className="premium-surface flex h-36 items-center justify-center rounded-lg">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="premium-surface rounded-lg border-brand-slate/30 bg-brand-slate/10 p-6 text-sm text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                    {t('pages.users.errors.loadFailed', { defaultValue: 'Unable to load users right now.' })}
                </div>
            )}

            {users && (
                <div className="space-y-6">
                    <RosterToolbar
                        searchTerm={searchTerm}
                        roleFilter={roleFilter}
                        statusFilter={statusFilter}
                        hotelFilter={hotelFilter}
                        allHotels={allHotels}
                        activeFilterCount={activeFilterCount}
                        onSearchChange={setSearchTerm}
                        onRoleChange={setRoleFilter}
                        onStatusChange={setStatusFilter}
                        onHotelChange={setHotelFilter}
                        onReset={resetFilters}
                    />

                    <AdminSectionCard
                        eyebrow={t('pages.users.admins.eyebrow', { defaultValue: 'Governance Layer' })}
                        title={t('pages.users.admins.title', { defaultValue: 'Organization admins' })}
                        description={t('pages.users.admins.description', { defaultValue: 'Admins manage access rules and overall workspace governance.' })}
                        actions={(
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-navy/10 bg-brand-navy px-4 py-2 text-sm font-medium text-brand-light dark:border-brand-light/10 dark:bg-brand-light/8">
                                <Briefcase size={16} />
                                {activeFilterCount > 0
                                    ? t('pages.users.admins.filteredCount', { defaultValue: '{{shown}}/{{total}} admin seats', shown: filteredAdmins.length, total: admins.length })
                                    : t('pages.users.admins.count', { defaultValue: '{{count}} admin seats', count: admins.length })}
                            </div>
                        )}
                    >
                        <UserTable
                            users={filteredAdmins}
                            currentUserId={currentUser?.id}
                            emptyLabel={activeFilterCount > 0
                                ? t('pages.users.admins.emptyFiltered', { defaultValue: 'No admin users match the current filters.' })
                                : t('pages.users.admins.empty', { defaultValue: 'No admin seats are active yet.' })}
                            showHotels={false}
                            onEdit={setEditingUser}
                            onSuspend={handleSuspend}
                            onReactivate={handleReactivate}
                            onRemoveInvite={handleRemoveInvite}
                            isActionPending={isUserActionPending}
                        />
                    </AdminSectionCard>

                    <AdminSectionCard
                        eyebrow={t('pages.users.commercials.eyebrow', { defaultValue: 'Portfolio Coverage' })}
                        title={t('pages.users.commercials.title', { defaultValue: 'Commercial team' })}
                        description={t('pages.users.commercials.description', { defaultValue: 'Commercial users work inside the hotel portfolio, so assignments should stay tightly scoped and current.' })}
                        actions={(
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/8 px-4 py-2 text-sm font-medium text-brand-mint">
                                <Building2 size={16} />
                                {activeFilterCount > 0
                                    ? t('pages.users.commercials.filteredCount', { defaultValue: '{{shown}}/{{total}} commercial seats', shown: filteredCommercials.length, total: commercials.length })
                                    : formatTeamCoverage(t, commercials.length, allHotels.length, 'commercial')}
                            </div>
                        )}
                    >
                        <UserTable
                            users={filteredCommercials}
                            currentUserId={currentUser?.id}
                            emptyLabel={activeFilterCount > 0
                                ? t('pages.users.commercials.emptyFiltered', { defaultValue: 'No commercial users match the current filters.' })
                                : t('pages.users.commercials.empty', { defaultValue: 'No commercial users have been assigned yet.' })}
                            showHotels
                            onEdit={setEditingUser}
                            onSuspend={handleSuspend}
                            onReactivate={handleReactivate}
                            onRemoveInvite={handleRemoveInvite}
                            isActionPending={isUserActionPending}
                        />
                    </AdminSectionCard>

                    <AdminSectionCard
                        eyebrow={t('pages.users.agents.eyebrow', { defaultValue: 'Simulator Access' })}
                        title={t('pages.users.agents.title', { defaultValue: 'Agent team' })}
                        description={t('pages.users.agents.description', { defaultValue: 'Agents can run simulator quotes and print ticket-style summaries for operational follow-up.' })}
                        actions={(
                            <div className="inline-flex items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/8 px-4 py-2 text-sm font-medium text-brand-mint">
                                <UserCog size={16} />
                                {activeFilterCount > 0
                                    ? t('pages.users.agents.filteredCount', { defaultValue: '{{shown}}/{{total}} agent seats', shown: filteredAgents.length, total: agents.length })
                                    : formatTeamCoverage(t, agents.length, allHotels.length, 'agent')}
                            </div>
                        )}
                    >
                        <UserTable
                            users={filteredAgents}
                            currentUserId={currentUser?.id}
                            emptyLabel={activeFilterCount > 0
                                ? t('pages.users.agents.emptyFiltered', { defaultValue: 'No agent users match the current filters.' })
                                : t('pages.users.agents.empty', { defaultValue: 'No simulator-only agents have been invited yet.' })}
                            showHotels
                            onEdit={setEditingUser}
                            onSuspend={handleSuspend}
                            onReactivate={handleReactivate}
                            onRemoveInvite={handleRemoveInvite}
                            isActionPending={isUserActionPending}
                        />
                    </AdminSectionCard>

                    <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                        <div className="rounded-lg border border-brand-mint/20 bg-brand-mint/10 p-6 shadow-md dark:border-brand-mint/20 dark:bg-brand-navy/80">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate dark:text-brand-light/75">{t('pages.users.guidance.eyebrow', { defaultValue: 'Access Hygiene' })}</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{t('pages.users.guidance.title', { defaultValue: 'Keep assignments clean as the portfolio grows.' })}</h3>
                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                {[
                                    t('pages.users.guidance.items.reviewPending', { defaultValue: 'Review pending invites before opening a new invitation batch.' }),
                                    t('pages.users.guidance.items.auditAdmins', { defaultValue: 'Limit admin seats to users handling governance decisions.' }),
                                    t('pages.users.guidance.items.alignHotels', { defaultValue: "Match hotel assignments to each commercial user's current operating scope." }),
                                ].map((item) => (
                                    <div key={item} className="rounded-lg border border-brand-light/60 bg-brand-light/72 px-4 py-3 text-sm text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
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
                                    { label: t('pages.users.summary.agentAccess', { defaultValue: 'Simulator agents' }), value: `${agents.length}/${Math.max(users.length, 1)}` },
                                    { label: t('pages.users.summary.hotelAssignments', { defaultValue: 'Hotel assignments' }), value: `${assignedHotels}/${Math.max(allHotels.length, 1)}` },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border border-brand-light/70 bg-brand-light/72 px-4 py-4 dark:border-brand-light/10 dark:bg-brand-light/5">
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
            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                allHotels={allHotels}
                isCurrentUserOnlyAdmin={Boolean(
                    editingUser
                    && editingUser.id === currentUser?.id
                    && editingUser.role === 'ADMIN'
                    && activeAdminCount <= 1,
                )}
            />
        </div>
    );
}
