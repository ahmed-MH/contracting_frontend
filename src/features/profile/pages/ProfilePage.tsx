import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import {
    BadgeCheck,
    BedDouble,
    Building2,
    Calculator,
    FileText,
    Hotel,
    LockKeyhole,
    Mail,
    ShieldCheck,
    UserCog,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useChangePassword, useCurrentProfile, useUpdateProfile } from '../hooks/useProfile';
import type { CurrentProfile } from '../services/profile.service';

function getDisplayName(profile?: CurrentProfile | null, fallback = 'Profile'): string {
    const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    return name || profile?.email || fallback;
}

function getInitials(profile?: CurrentProfile | null): string {
    const source = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || profile?.email || 'U';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function statusLabel(profile?: CurrentProfile | null): string {
    if (profile?.accountStatus) return profile.accountStatus.replace(/_/g, ' ');
    return profile?.isActive ? 'ACTIVE' : 'SUSPENDED';
}

function roleDescription(role: string | undefined): string {
    if (role === 'ADMIN') return 'Administrator with user, hotel, and integration access.';
    if (role === 'COMMERCIAL') return 'Commercial user with access to assigned hotel contracting operations.';
    if (role === 'AGENT') return 'Operational user focused on stay-price simulation.';
    return 'User profile.';
}

function ProfileCard({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-brand-light/70 bg-brand-light/78 p-5 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{title}</h2>
            {description ? <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{description}</p> : null}
            <div className="mt-5">{children}</div>
        </section>
    );
}

function DetailTile({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: LucideIcon }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/55 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="flex items-start gap-3">
                {Icon ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mint/10 text-brand-mint">
                        <Icon size={17} />
                    </span>
                ) : null}
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">{label}</p>
                    <div className="mt-2 break-words text-sm font-semibold text-brand-navy dark:text-brand-light">{value}</div>
                </div>
            </div>
        </div>
    );
}

function QuickAction({ to, label, description, icon: Icon }: { to: string; label: string; description: string; icon: LucideIcon }) {
    return (
        <Link
            to={to}
            className="group rounded-2xl border border-brand-light/70 bg-brand-light/60 p-4 transition hover:-translate-y-0.5 hover:border-brand-mint/30 hover:bg-brand-light/90 dark:border-brand-light/10 dark:bg-brand-light/5 dark:hover:bg-brand-light/8"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/10 text-brand-mint">
                <Icon size={17} />
            </span>
            <p className="mt-3 font-semibold text-brand-navy dark:text-brand-light">{label}</p>
            <p className="mt-1 text-sm leading-5 text-brand-slate dark:text-brand-light/70">{description}</p>
        </Link>
    );
}

function TextInput({
    label,
    value,
    onChange,
    type = 'text',
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    autoComplete?: string;
}) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                autoComplete={autoComplete}
                className="mt-2 h-12 w-full rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-navy outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
            />
        </label>
    );
}

function RoleSpecificSection({ profile }: { profile: CurrentProfile }) {
    if (profile.role === 'ADMIN') {
        return (
            <ProfileCard
                eyebrow="Admin controls"
                title="Internal administration"
                description="Manage team access, hotel setup, and internal integration settings."
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <QuickAction to="/admin/users" label="Manage users" description="Review users, invitations, and roles." icon={UserCog} />
                    <QuickAction to="/hotel-setup/hotel-information" label="Hotel information" description="Maintain the hotel profile and legal details." icon={Hotel} />
                    <QuickAction to="/hotel-setup/exchange-rates" label="Exchange rates" description="Review configured currency pairs." icon={Building2} />
                    <QuickAction to="/admin/integrations/overview" label="Integrations" description="Manage API users, keys, and usage logs." icon={ShieldCheck} />
                </div>
            </ProfileCard>
        );
    }

    if (profile.role === 'COMMERCIAL') {
        return (
            <ProfileCard
                eyebrow="Commercial workspace"
                title="Assigned work area"
                description="Shortcuts for hotel setup, catalog maintenance, contracts, and invoice consultation."
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <QuickAction to="/hotel-setup/hotel-information" label="Hotel information" description="Check assigned hotel details." icon={Hotel} />
                    <QuickAction to="/partners/affiliates" label="Partners" description="Manage tour operators and partners." icon={Users} />
                    <QuickAction to="/contracts" label="Contracts" description="Work on commercial agreements." icon={FileText} />
                    <QuickAction to="/proforma/invoices" label="Invoices" description="Open issued invoice history." icon={FileText} />
                </div>
            </ProfileCard>
        );
    }

    return (
        <ProfileCard
            eyebrow="Agent access"
            title="Permissions and modules"
            description="This role is focused on the tools available to operational users."
        >
            <div className="grid gap-3 md:grid-cols-3">
                <DetailTile label="Accessible modules" value="Rate simulation" icon={Calculator} />
                <DetailTile label="Contract access" value="Limited" icon={LockKeyhole} />
                <DetailTile label="Profile access" value="Self-service" icon={UserCog} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
                <QuickAction to="/simulator" label="Open simulator" description="Run stay-price calculations." icon={Calculator} />
                <QuickAction to="/profile" label="Review profile" description="Keep your personal details current." icon={UserCog} />
            </div>
        </ProfileCard>
    );
}

export default function ProfilePage() {
    const { t } = useTranslation('common');
    const { syncUserProfile } = useAuth();
    const { data: profile, isLoading, isError } = useCurrentProfile();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!profile) return;
        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
    }, [profile]);

    const updateProfile = useUpdateProfile((updatedProfile) => {
        syncUserProfile({
            firstName: updatedProfile.firstName ?? '',
            lastName: updatedProfile.lastName ?? '',
        });
    });
    const changePassword = useChangePassword(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    });

    const assignedHotels = useMemo(
        () => profile?.hotels?.map((hotel) => hotel.name).join(', ') || 'Not assigned',
        [profile],
    );

    const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateProfile.mutate({ firstName, lastName });
    };

    const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) return;
        changePassword.mutate({ currentPassword, newPassword });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="h-56 animate-pulse rounded-[2rem] bg-brand-slate/10 dark:bg-brand-light/10" />
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="h-72 animate-pulse rounded-2xl bg-brand-slate/10 dark:bg-brand-light/10" />
                    <div className="h-72 animate-pulse rounded-2xl bg-brand-slate/10 dark:bg-brand-light/10" />
                </div>
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/10 p-6 text-sm text-brand-coral">
                    {t('pages.profile.errors.loadFailed', { defaultValue: 'Profile details could not be loaded right now.' })}
                </div>
            </div>
        );
    }

    const displayName = getDisplayName(profile, t('pages.profile.title', { defaultValue: 'Profile' }));
    const initials = getInitials(profile);
    const passwordMismatch = Boolean(newPassword && confirmPassword && newPassword !== confirmPassword);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-brand-light/70 bg-brand-light/82 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)] md:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,217,138,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.07),transparent_44%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(57,217,138,0.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-brand-mint/14 text-3xl font-bold text-brand-mint ring-1 ring-brand-mint/20">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">Profile</p>
                            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{displayName}</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{roleDescription(profile.role)}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-mint">{profile.role}</span>
                                <span className={clsx(
                                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
                                    profile.isActive
                                        ? 'border-brand-mint/25 bg-brand-mint/10 text-brand-mint'
                                        : 'border-brand-coral/25 bg-brand-coral/10 text-brand-coral',
                                )}>
                                    {statusLabel(profile)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
                        <DetailTile label="Email" value={profile.email} icon={Mail} />
                        <DetailTile label="Organization" value={profile.tenant?.name ?? 'Internal'} icon={Building2} />
                        <DetailTile label="Assigned hotel" value={assignedHotels} icon={BedDouble} />
                        <DetailTile label="Account" value="Internal application" icon={BadgeCheck} />
                    </div>
                </div>
            </section>

            <RoleSpecificSection profile={profile} />

            <div className="grid gap-6 xl:grid-cols-2">
                <ProfileCard
                    eyebrow="Personal information"
                    title="Edit profile"
                    description="You can update your visible name. Email, role, organization, and hotel access are controlled by administrators."
                >
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextInput label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
                            <TextInput label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
                        </div>
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {updateProfile.isPending ? 'Saving...' : 'Save profile'}
                        </button>
                    </form>
                </ProfileCard>

                <ProfileCard
                    eyebrow="Security"
                    title="Change password"
                    description="Use your current password to protect the account change."
                >
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <TextInput label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" autoComplete="current-password" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextInput label="New password" value={newPassword} onChange={setNewPassword} type="password" autoComplete="new-password" />
                            <TextInput label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" />
                        </div>
                        {passwordMismatch ? <p className="text-sm font-semibold text-brand-coral">New password and confirmation do not match.</p> : null}
                        <button
                            type="submit"
                            disabled={changePassword.isPending || passwordMismatch || !currentPassword || !newPassword}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        >
                            {changePassword.isPending ? 'Updating...' : 'Change password'}
                        </button>
                    </form>
                </ProfileCard>
            </div>
        </div>
    );
}
