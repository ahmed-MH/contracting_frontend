import { Link } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    Briefcase,
    Building2,
    Calculator,
    CircleDollarSign,
    FileText,
    Hotel,
    KeyRound,
    LockKeyhole,
    ShieldCheck,
    UserCog,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminSectionCard from '../components/AdminSectionCard';
import { useTenantUsage, useUsers } from '../hooks/useUsers';
import { useHotels } from '../../hotel/hooks/useHotels';

interface MetricCardProps {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
}

interface ProgressRowProps {
    label: string;
    value: number;
    detail: string;
}

interface WorkAreaLinkProps {
    title: string;
    description: string;
    to: string;
    icon: LucideIcon;
    locked?: boolean;
    lockedLabel?: string;
}

function getUserAccountStatus(user: { isActive: boolean; accountStatus?: string }): 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED' {
    if (user.accountStatus === 'ACTIVE' || user.accountStatus === 'PENDING_INVITE' || user.accountStatus === 'SUSPENDED') {
        return user.accountStatus;
    }

    return user.isActive ? 'ACTIVE' : 'PENDING_INVITE';
}

function formatPercent(value: number): string {
    return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-brand-light/70 bg-brand-light/78 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-mint/25 hover:shadow-md dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-mint/70 opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-slate">{label}</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {value}
                    </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mint/10 text-brand-mint ring-1 ring-brand-mint/15 transition group-hover:bg-brand-mint/14">
                    <Icon size={18} />
                </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{detail}</p>
        </article>
    );
}

function MetricSkeletonGrid() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-brand-light/70 bg-brand-light/55 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="w-full animate-pulse space-y-4">
                            <div className="h-3 w-28 rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                            <div className="h-8 w-16 rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                            <div className="h-3 w-4/5 rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                        </div>
                        <div className="h-11 w-11 shrink-0 rounded-lg bg-brand-mint/10" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProgressRow({ label, value, detail }: ProgressRowProps) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/55 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-brand-navy dark:text-brand-light">{label}</span>
                <span className="text-brand-slate dark:text-brand-light/75">{formatPercent(value)}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-brand-slate/10 dark:bg-brand-light/10">
                <div className="h-full rounded-full bg-brand-mint" style={{ width: formatPercent(value) }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/70">{detail}</p>
        </div>
    );
}

function WorkAreaContent({ title, description, icon: Icon, locked, lockedLabel }: Omit<WorkAreaLinkProps, 'to'>) {
    return (
        <>
            <span className="absolute inset-x-0 top-0 h-1 bg-brand-mint/70 opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mint/10 text-brand-mint ring-1 ring-brand-mint/15 transition group-hover:bg-brand-mint/14">
                    <Icon size={18} />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 text-brand-slate transition group-hover:translate-x-0.5 group-hover:border-brand-mint/25 group-hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5">
                    {locked ? <LockKeyhole size={16} /> : <ArrowRight size={16} />}
                </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <p className="font-semibold text-brand-navy dark:text-brand-light">{title}</p>
                {locked ? (
                    <span className="rounded-full border border-brand-coral/25 bg-brand-coral/10 px-2.5 py-1 text-[11px] font-semibold text-brand-coral">
                        Plan locked
                    </span>
                ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{description}</p>
            {lockedLabel ? <p className="mt-3 text-xs font-semibold text-brand-coral">{lockedLabel}</p> : null}
        </>
    );
}

function WorkAreaLink({ title, description, to, icon, locked, lockedLabel }: WorkAreaLinkProps) {
    const className = locked
        ? 'group relative overflow-hidden rounded-2xl border border-brand-coral/25 bg-brand-coral/8 p-5 shadow-sm opacity-95 dark:bg-brand-coral/8'
        : 'group relative overflow-hidden rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-mint/30 hover:bg-brand-light/90 hover:shadow-md dark:border-brand-light/10 dark:bg-brand-light/5 dark:hover:bg-brand-light/8';

    if (locked) {
        return (
            <div className={className} aria-disabled="true">
                <WorkAreaContent title={title} description={description} icon={icon} locked={locked} lockedLabel={lockedLabel} />
            </div>
        );
    }

    return (
        <Link to={to} className={className}>
            <WorkAreaContent title={title} description={description} icon={icon} />
        </Link>
    );
}

export default function AdminOverviewPage() {
    const { t } = useTranslation('common');
    const { data: users = [], isLoading: usersLoading, isError: usersError } = useUsers();
    const { data: tenantUsage } = useTenantUsage();
    const { data: hotels = [], isLoading: hotelsLoading, isError: hotelsError } = useHotels();

    const admins = users.filter((user) => user.role === 'ADMIN');
    const commercials = users.filter((user) => user.role === 'COMMERCIAL');
    const activeUsers = users.filter((user) => getUserAccountStatus(user) === 'ACTIVE').length;
    const pendingUsers = users.filter((user) => getUserAccountStatus(user) === 'PENDING_INVITE').length;
    const assignedHotelIds = new Set(
        commercials
            .filter((user) => getUserAccountStatus(user) === 'ACTIVE')
            .flatMap((user) => user.hotels?.map((hotel) => hotel.id) ?? []),
    );
    const hotelCoverage = hotels.length > 0 ? (assignedHotelIds.size / hotels.length) * 100 : 0;
    const activationRate = users.length > 0 ? (activeUsers / users.length) * 100 : 0;
    const adminRatio = users.length > 0 ? (admins.length / users.length) * 100 : 0;
    const unassignedHotels = Math.max(0, hotels.length - assignedHotelIds.size);
    const isLoading = usersLoading || hotelsLoading;
    const hasError = usersError || hotelsError;
    const apiAccessLocked = tenantUsage?.canUseApiAccess === false;
    const hasPlan = tenantUsage?.hasPlan !== false;

    const attentionItems = [
        pendingUsers > 0
            ? t('pages.adminOverview.attention.pendingInvites', {
                defaultValue: '{{count}} pending invite needs review before the next onboarding batch.',
                count: pendingUsers,
            })
            : t('pages.adminOverview.attention.noPendingInvites', {
                defaultValue: 'No pending invites are waiting on the team roster.',
            }),
        unassignedHotels > 0
            ? t('pages.adminOverview.attention.unassignedHotels', {
                defaultValue: '{{count}} hotel needs a commercial owner assigned.',
                count: unassignedHotels,
            })
            : t('pages.adminOverview.attention.allHotelsAssigned', {
                defaultValue: 'Every active hotel has commercial coverage.',
            }),
        admins.length === 0
            ? t('pages.adminOverview.attention.noAdmins', {
                defaultValue: 'Add at least one admin seat for governance continuity.',
            })
            : t('pages.adminOverview.attention.adminCoverage', {
                defaultValue: '{{count}} admin seat keeps governance available.',
                count: admins.length,
            }),
    ];

    const workAreas = [
        {
            title: t('pages.adminOverview.workAreas.team.title', { defaultValue: 'Team access' }),
            description: t('pages.adminOverview.workAreas.team.description', { defaultValue: 'Invite users, tune roles, and assign commercial users to hotels.' }),
            to: '/admin/users',
            icon: Users,
        },
        {
            title: t('pages.adminOverview.workAreas.integrations.title', { defaultValue: 'Integrations' }),
            description: apiAccessLocked
                ? hasPlan
                    ? t('pages.adminOverview.workAreas.integrations.lockedDescription', { defaultValue: 'This plan does not include active API access, keys, endpoint controls, or usage logs.' })
                    : t('pages.adminOverview.workAreas.integrations.noPlanDescription', { defaultValue: 'No plan is assigned to this organization, so API access is unavailable.' })
                : t('pages.adminOverview.workAreas.integrations.description', { defaultValue: 'Manage API users, keys, endpoint policy, and request logs.' }),
            to: '/admin/integrations/overview',
            icon: KeyRound,
            locked: apiAccessLocked,
            lockedLabel: apiAccessLocked
                ? t('pages.adminOverview.workAreas.integrations.lockedLabel', { defaultValue: 'Choose or upgrade a plan from your profile.' })
                : undefined,
        },
        {
            title: t('pages.adminOverview.workAreas.hotels.title', { defaultValue: 'Hotel information' }),
            description: t('pages.adminOverview.workAreas.hotels.description', { defaultValue: 'Keep property identity, contacts, legal details, and branding current.' }),
            to: '/hotel-setup/hotel-information',
            icon: Hotel,
        },
        {
            title: t('pages.adminOverview.workAreas.exchangeRates.title', { defaultValue: 'Exchange rates' }),
            description: t('pages.adminOverview.workAreas.exchangeRates.description', { defaultValue: 'Control currency pairs used in previews, exports, and simulations.' }),
            to: '/hotel-setup/exchange-rates',
            icon: CircleDollarSign,
        },
        {
            title: t('pages.adminOverview.workAreas.contracts.title', { defaultValue: 'Contracts' }),
            description: t('pages.adminOverview.workAreas.contracts.description', { defaultValue: 'Review commercial terms, lifecycle status, and readiness gaps.' }),
            to: '/contracts',
            icon: FileText,
        },
        {
            title: t('pages.adminOverview.workAreas.simulator.title', { defaultValue: 'Simulator' }),
            description: t('pages.adminOverview.workAreas.simulator.description', { defaultValue: 'Spot-check contracted selling prices before operational use.' }),
            to: '/simulator',
            icon: Calculator,
        },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <AdminPageHeader
                eyebrow={t('pages.adminOverview.header.eyebrow', { defaultValue: 'Admin Overview' })}
                title={t('pages.adminOverview.header.title', { defaultValue: 'A clean control room for the organization.' })}
                description={t('pages.adminOverview.header.subtitle', { defaultValue: 'Track the essentials for admin work: access, hotel ownership, integrations, and the commercial tools admins can supervise.' })}
                badge={isLoading
                    ? t('pages.adminOverview.header.loadingBadge', { defaultValue: 'Loading workspace' })
                    : t('pages.adminOverview.header.badge', { defaultValue: '{{count}} workspace seats', count: users.length })}
            >
                {isLoading ? (
                    <MetricSkeletonGrid />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label={t('pages.adminOverview.metrics.activeUsers', { defaultValue: 'Active users' })}
                            value={activeUsers}
                            detail={t('pages.adminOverview.metrics.activeUsersDetail', { defaultValue: '{{count}} pending invites in the access queue.', count: pendingUsers })}
                            icon={ShieldCheck}
                        />
                        <MetricCard
                            label={t('pages.adminOverview.metrics.adminSeats', { defaultValue: 'Admin seats' })}
                            value={admins.length}
                            detail={t('pages.adminOverview.metrics.adminSeatsDetail', { defaultValue: '{{count}} commercial users handle production work.', count: commercials.length })}
                            icon={Briefcase}
                        />
                        <MetricCard
                            label={t('pages.adminOverview.metrics.hotels', { defaultValue: 'Active hotels' })}
                            value={hotels.length}
                            detail={t('pages.adminOverview.metrics.hotelsDetail', { defaultValue: '{{count}} hotels are assigned to commercial users.', count: assignedHotelIds.size })}
                            icon={Building2}
                        />
                        <MetricCard
                            label={t('pages.adminOverview.metrics.coverage', { defaultValue: 'Hotel coverage' })}
                            value={formatPercent(hotelCoverage)}
                            detail={t('pages.adminOverview.metrics.coverageDetail', { defaultValue: '{{count}} hotels still need ownership.', count: unassignedHotels })}
                            icon={Activity}
                        />
                    </div>
                )}
            </AdminPageHeader>

            {hasError && (
                <div className="premium-surface rounded-lg border-brand-slate/30 bg-brand-slate/10 p-6 text-sm text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
                    {t('pages.adminOverview.errors.loadFailed', { defaultValue: 'Some admin overview data could not be loaded right now.' })}
                </div>
            )}

            {!isLoading && !hasError && (
                <>
            <section className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                <AdminSectionCard
                    eyebrow={t('pages.adminOverview.health.eyebrow', { defaultValue: 'Workspace Health' })}
                    title={t('pages.adminOverview.health.title', { defaultValue: 'Core operating signals' })}
                    description={t('pages.adminOverview.health.description', { defaultValue: 'A quick read on whether access and hotel ownership are ready for daily operation.' })}
                >
                    <div className="space-y-5">
                        <ProgressRow
                            label={t('pages.adminOverview.health.activation', { defaultValue: 'Seat activation' })}
                            value={activationRate}
                            detail={t('pages.adminOverview.health.activationDetail', { defaultValue: '{{active}} of {{total}} users are active.', active: activeUsers, total: users.length })}
                        />
                        <ProgressRow
                            label={t('pages.adminOverview.health.hotelCoverage', { defaultValue: 'Hotel ownership' })}
                            value={hotelCoverage}
                            detail={t('pages.adminOverview.health.hotelCoverageDetail', { defaultValue: '{{assigned}} of {{total}} hotels have commercial coverage.', assigned: assignedHotelIds.size, total: hotels.length })}
                        />
                        <ProgressRow
                            label={t('pages.adminOverview.health.adminPresence', { defaultValue: 'Admin presence' })}
                            value={adminRatio}
                            detail={t('pages.adminOverview.health.adminPresenceDetail', { defaultValue: '{{admins}} admin seats across {{total}} users.', admins: admins.length, total: users.length })}
                        />
                    </div>
                </AdminSectionCard>

                <AdminSectionCard
                    eyebrow={t('pages.adminOverview.attention.eyebrow', { defaultValue: 'Attention Queue' })}
                    title={t('pages.adminOverview.attention.title', { defaultValue: 'What to check first' })}
                    description={t('pages.adminOverview.attention.description', { defaultValue: 'Small governance checks that keep the admin layer clean before commercial work accelerates.' })}
                    actions={(
                        <Link
                            to="/admin/users"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-mint/25 bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light"
                        >
                            <UserCog size={16} />
                            {t('pages.adminOverview.attention.reviewTeam', { defaultValue: 'Review team' })}
                        </Link>
                    )}
                >
                    <div className="grid gap-3">
                        {attentionItems.map((item) => (
                            <div key={item} className="rounded-2xl border border-brand-light/70 bg-brand-light/60 px-4 py-4 text-sm leading-6 text-brand-navy shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                                {item}
                            </div>
                        ))}
                    </div>
                </AdminSectionCard>
            </section>

            <AdminSectionCard
                eyebrow={t('pages.adminOverview.workAreas.eyebrow', { defaultValue: 'Admin Work Areas' })}
                title={t('pages.adminOverview.workAreas.title', { defaultValue: 'Jump into the right surface' })}
                description={t('pages.adminOverview.workAreas.description', { defaultValue: 'A compact map of the pages admins use to govern the organization and supervise production activity.' })}
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {workAreas.map((item) => (
                        <WorkAreaLink key={item.to} {...item} />
                    ))}
                </div>
            </AdminSectionCard>
                </>
            )}
        </div>
    );
}
