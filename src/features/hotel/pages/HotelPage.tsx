import { useState } from 'react';
import {
    useArchivedHotels,
    useCreateHotel,
    useUpdateHotel,
    useDeleteHotel,
    useRestoreHotel,
    type Hotel,
    type CreateHotelPayload,
} from '../hooks/useHotels';
import { useAuth } from '../../auth/context/AuthContext';
import { useTenantUsage } from '../../admin/hooks/useUsers';
import { useConfirm } from '../../../context/ConfirmContext';
import { useHotel } from '../context/HotelContext';
import {
    Archive,
    ArrowUpRight,
    Building2,
    ChevronDown,
    Coins,
    Hotel as HotelIcon,
    Image,
    Landmark,
    Mail,
    MapPin,
    Palette,
    Pencil,
    Plus,
    RotateCcw,
    Star,
    Trash2,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import EditHotelModal from '../components/EditHotelModal';
import HotelLogoPreview from '../components/HotelLogoPreview';
import HotelLogoUploadModal from '../components/HotelLogoUploadModal';
import { GuidedPageHeader } from '../../../components/layout/Workspace';
import UpdatedByCell from '../../../components/audit/UpdatedByCell';
import UpdatedMeta from '../../../components/audit/UpdatedMeta';

function DetailCard({
    icon: Icon,
    eyebrow,
    title,
    children,
}: {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="premium-surface p-6">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-mint/12 p-3 text-brand-mint">
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                        {eyebrow}
                    </p>
                    <h3 className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                        {title}
                    </h3>
                </div>
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}

function InfoRow({ label, value, valueClassName = '' }: { label: string; value?: string | number | null; valueClassName?: string }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                {label}
            </p>
            <p className={`mt-2 break-words text-sm font-semibold text-brand-navy dark:text-brand-light ${valueClassName}`}>
                {value || 'Not provided'}
            </p>
        </div>
    );
}

function Stars({ value }: { value?: number }) {
    if (!value) {
        return (
            <span className="premium-pill border-brand-slate/20 bg-brand-light text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                Unrated
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-slate/30 bg-brand-slate/10 px-3 py-1 text-xs font-semibold text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75">
            {Array.from({ length: value }).map((_, index) => (
                <Star key={index} size={13} fill="currentColor" />
            ))}
        </span>
    );
}

export default function HotelPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
    const [editing, setEditing] = useState<Hotel | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const { currentHotel, availableHotels, switchHotel, isLoading: isContextLoading } = useHotel();
    const { data: tenantUsage } = useTenantUsage();

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };
    const { data: archivedHotels } = useArchivedHotels(isAdmin && showArchived);

    const createMutation = useCreateHotel(closeModal);
    const updateMutation = useUpdateHotel(closeModal);
    const deleteMutation = useDeleteHotel();
    const restoreMutation = useRestoreHotel();

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };
    const openEdit = (hotel: Hotel) => {
        setEditing(hotel);
        setIsModalOpen(true);
    };

    const handleDelete = async (hotel: Hotel) => {
        if (await confirm({
            title: t('pages.hotel.confirmArchive.title', {
                defaultValue: 'Archive {{name}}?',
                name: hotel.name,
            }),
            description: t('pages.hotel.confirmArchive.description', {
                defaultValue: 'This property will move to the archive and no longer appear in the active portfolio.',
            }),
            confirmLabel: t('pages.hotel.confirmArchive.confirmLabel', { defaultValue: 'Archive hotel' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(hotel.id);
        }
    };

    const handleRestore = async (hotel: Hotel) => {
        if (await confirm({
            title: t('pages.hotel.confirmRestore.title', {
                defaultValue: 'Restore {{name}}?',
                name: hotel.name,
            }),
            description: t('pages.hotel.confirmRestore.description', {
                defaultValue: 'This property will return to the active hotel portfolio.',
            }),
            confirmLabel: t('pages.hotel.confirmRestore.confirmLabel', { defaultValue: 'Restore hotel' }),
            variant: 'info',
        })) {
            restoreMutation.mutate(hotel.id);
        }
    };

    const onSubmit = (data: CreateHotelPayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data });
            return;
        }
        createMutation.mutate(data);
    };

    if (isContextLoading) {
        return (
            <div className="p-4 md:p-6">
                <div className="premium-surface flex min-h-[360px] items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <GuidedPageHeader
                icon={HotelIcon}
                kicker={t('pages.hotel.header.eyebrow', { defaultValue: 'Hotel Portfolio' })}
                title={t('pages.hotel.header.title', { defaultValue: 'Property profile' })}
                description={t('pages.hotel.header.subtitle', { defaultValue: 'Keep property identity, contacts, legal details, and operational metadata aligned with the commercial workspace.' })}
                actions={(
                <>
                    <div className="hidden">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.hotel.header.eyebrow', { defaultValue: 'Hotel Portfolio' })}
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            {t('pages.hotel.header.title', { defaultValue: 'Property profile' })}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {t('pages.hotel.header.subtitle', { defaultValue: 'Keep property identity, contacts, legal details, and operational metadata aligned with the commercial workspace.' })}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {availableHotels.length > 1 && (
                            <div className="relative">
                                <HotelIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-mint" />
                                <select
                                    value={currentHotel?.id || ''}
                                    onChange={(event) => switchHotel(Number(event.target.value))}
                                    className="h-11 w-full min-w-64 appearance-none rounded-2xl border border-brand-light/70 bg-brand-light/72 pl-11 pr-10 text-sm font-semibold text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                >
                                    {availableHotels.map((hotel) => (
                                        <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-slate" />
                            </div>
                        )}

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                            >
                                <Plus size={16} />
                                {t('pages.hotel.header.newHotel', { defaultValue: 'New hotel' })}
                            </button>
                        )}
                    </div>
                </>
                )}
            />

            {!currentHotel ? (
                <section className="premium-surface border-dashed p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-mint/10 text-brand-mint">
                        <Building2 size={30} />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-brand-navy dark:text-brand-light">
                        {t('pages.hotel.header.emptyTitle', { defaultValue: 'No hotel selected' })}
                    </h2>
                    <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                        {t('pages.hotel.header.emptySubtitle', { defaultValue: 'Choose a property to continue.' })}
                    </p>
                </section>
            ) : (
                <div className="space-y-6">
                    <section className="rounded-2xl bg-brand-navy p-6 text-brand-light shadow-md">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-3xl font-semibold tracking-tight">{currentHotel.name}</h2>
                                    <Stars value={currentHotel.stars} />
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-brand-slate">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-light/8 px-3 py-1">
                                        <Building2 size={14} className="text-brand-mint" />
                                        {currentHotel.fiscalName || t('common.notAvailable', { defaultValue: 'Legal entity pending' })}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-light/8 px-3 py-1">
                                        <Coins size={14} className="text-brand-mint" />
                                        {currentHotel.defaultCurrency}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-light/8 px-3 py-1">
                                        Ref {currentHotel.reference || 'HTL-PENDING'}
                                    </span>
                                </div>
                                <UpdatedMeta
                                    updatedByName={currentHotel.updatedByName}
                                    updatedAt={currentHotel.updatedAt}
                                    tone="dark"
                                    className="mt-5 max-w-xs"
                                />
                            </div>

                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(currentHotel)}
                                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-brand-light/10 bg-brand-light/8 px-4 text-sm font-semibold text-brand-light transition hover:bg-brand-light/12"
                                    >
                                        <Pencil size={15} className="text-brand-mint" />
                                        {t('actions.edit', { defaultValue: 'Edit profile' })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(currentHotel)}
                                        disabled={deleteMutation.isPending}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-slate/30 bg-brand-slate/20 text-brand-slate transition hover:bg-brand-slate/20 disabled:opacity-50"
                                        aria-label={t('pages.hotel.actions.archive', { defaultValue: 'Archive hotel' })}
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: t('pages.hotel.metrics.activeProperties', { defaultValue: 'Hotels used' }), value: tenantUsage ? `${tenantUsage.hotels.used}/${tenantUsage.hotels.limit}` : availableHotels.length, icon: HotelIcon },
                            { label: t('pages.hotel.metrics.contactEmails', { defaultValue: 'Contact emails' }), value: currentHotel.emails?.length ?? 0, icon: Mail },
                            { label: t('pages.hotel.metrics.defaultCurrency', { defaultValue: 'Default currency' }), value: currentHotel.defaultCurrency, icon: Coins },
                            { label: t('pages.hotel.metrics.branding', { defaultValue: 'PDF branding' }), value: currentHotel.preferredThemeColor || (currentHotel.logoUrl ? 'Logo' : 'Default'), icon: Palette },
                        ].map((metric) => {
                            const Icon = metric.icon;
                            return (
                                <div key={metric.label} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm font-medium text-brand-slate">{metric.label}</p>
                                        <div className="rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                                            <Icon size={18} />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                        {metric.value}
                                    </p>
                                </div>
                            );
                        })}
                    </section>

                    <section className="premium-surface overflow-hidden">
                        <div className="flex flex-col gap-2 border-b border-brand-light/70 px-6 py-5 dark:border-brand-light/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                {t('pages.hotel.portfolio.eyebrow', { defaultValue: 'Roster' })}
                            </p>
                            <h3 className="text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                {t('pages.hotel.portfolio.title', { defaultValue: 'Active hotel portfolio' })}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[720px] w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-brand-light/70 bg-brand-light/60 dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">
                                            {t('pages.hotel.portfolio.columns.hotel', { defaultValue: 'Hotel' })}
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">
                                            {t('pages.hotel.portfolio.columns.currency', { defaultValue: 'Currency' })}
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">
                                            {t('pages.hotel.portfolio.columns.updatedBy', { defaultValue: 'Updated by' })}
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-brand-slate dark:text-brand-light/65">
                                            {t('pages.hotel.portfolio.columns.actions', { defaultValue: 'Actions' })}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/70 dark:divide-brand-light/10">
                                    {availableHotels.map((hotel) => {
                                        const isCurrent = hotel.id === currentHotel.id;

                                        return (
                                            <tr key={hotel.id} className="transition-colors hover:bg-brand-light/60 dark:hover:bg-brand-light/5">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-brand-navy dark:text-brand-light">{hotel.name}</span>
                                                            {isCurrent && (
                                                                <span className="inline-flex items-center rounded-full border border-brand-mint/30 bg-brand-mint/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-mint">
                                                                    {t('pages.hotel.portfolio.current', { defaultValue: 'Current' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-brand-slate dark:text-brand-light/55">
                                                            {hotel.reference || 'HTL-PENDING'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full border border-brand-light/70 bg-brand-light/70 px-3 py-1 text-xs font-semibold text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                                        {hotel.defaultCurrency}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <UpdatedByCell updatedByName={hotel.updatedByName} updatedAt={hotel.updatedAt} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isCurrent ? (
                                                        <span className="text-xs font-medium text-brand-slate dark:text-brand-light/55">
                                                            {t('pages.hotel.portfolio.currentHelper', { defaultValue: 'Open in workspace' })}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => switchHotel(hotel.id)}
                                                            className="inline-flex h-10 items-center rounded-2xl border border-brand-mint/25 bg-brand-mint/8 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light"
                                                        >
                                                            {t('pages.hotel.portfolio.open', { defaultValue: 'Open hotel' })}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-4">
                        <DetailCard
                            icon={Image}
                            eyebrow={t('pages.hotel.cards.branding.eyebrow', { defaultValue: 'Documents' })}
                            title={t('pages.hotel.cards.branding.title', { defaultValue: 'PDF branding' })}
                        >
                            <div className="space-y-3">
                                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-4 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                        <HotelLogoPreview
                                            logoUrl={currentHotel.logoUrl}
                                            hotelName={currentHotel.name}
                                            className="h-28 w-28 shrink-0 rounded-[24px]"
                                            imageClassName="p-3"
                                            fallbackMode="icon"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                                {t('pages.hotel.fields.logoStatus', { defaultValue: 'Logo status' })}
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-brand-navy dark:text-brand-light">
                                                {currentHotel.logoUrl
                                                    ? t('pages.hotel.logoUpload.status.ready', { defaultValue: 'Logo configured' })
                                                    : t('pages.hotel.logoUpload.status.empty', { defaultValue: 'No logo uploaded yet' })}
                                            </p>
                                            {!currentHotel.logoUrl && (
                                                <p className="mt-2 text-xs leading-relaxed text-brand-slate dark:text-brand-light/75">
                                                    {t('pages.hotel.logoUpload.source.empty', { defaultValue: 'Upload a logo to brand previews and PDF exports.' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="mt-4 space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsLogoModalOpen(true)}
                                                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint"
                                            >
                                                <Image size={15} />
                                                {currentHotel.logoUrl
                                                    ? t('pages.hotel.logoUpload.actions.change', { defaultValue: 'Change logo' })
                                                    : t('pages.hotel.logoUpload.actions.upload', { defaultValue: 'Upload logo' })}
                                            </button>
                                            <p className="max-w-[17rem] text-xs leading-relaxed text-brand-slate dark:text-brand-light/75">
                                                {t('pages.hotel.logoUpload.actions.helper', { defaultValue: 'PNG and JPG upload natively. WebP is converted automatically to keep PDFs compatible.' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                        {t('pages.hotel.fields.themeColor', { defaultValue: 'Theme color' })}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span
                                            className="h-7 w-7 rounded-lg border border-brand-slate/20"
                                            style={{ backgroundColor: currentHotel.preferredThemeColor || '#0D9488' }}
                                        />
                                        <span className="font-mono text-sm font-semibold text-brand-navy dark:text-brand-light">
                                            {currentHotel.preferredThemeColor || 'Default'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </DetailCard>

                        <DetailCard
                            icon={MapPin}
                            eyebrow={t('pages.hotel.cards.location.eyebrow', { defaultValue: 'Location' })}
                            title={t('pages.hotel.cards.location.title', { defaultValue: 'Property coordinates' })}
                        >
                            <div className="space-y-3">
                                <InfoRow label={t('pages.hotel.fields.address', { defaultValue: 'Address' })} value={currentHotel.address} />
                                <div className="grid gap-3">
                                    <InfoRow
                                        label={t('pages.hotel.fields.phone', { defaultValue: 'Phone' })}
                                        value={currentHotel.phone}
                                        valueClassName="break-normal whitespace-nowrap text-[13px]"
                                    />
                                    <InfoRow
                                        label={t('pages.hotel.fields.fax', { defaultValue: 'Fax' })}
                                        value={currentHotel.fax}
                                        valueClassName="break-normal whitespace-nowrap text-[13px]"
                                    />
                                </div>
                                <div className="flex items-center gap-3 rounded-2xl border border-brand-mint/15 bg-brand-mint/8 px-4 py-4">
                                    <User size={17} className="text-brand-mint" />
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                            {t('pages.hotel.fields.legalRepresentative', { defaultValue: 'Legal representative' })}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-brand-navy dark:text-brand-light">
                                            {currentHotel.legalRepresentative || 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </DetailCard>

                        <DetailCard
                            icon={Mail}
                            eyebrow={t('pages.hotel.cards.contacts.eyebrow', { defaultValue: 'Contact Hub' })}
                            title={t('pages.hotel.cards.contacts.title', { defaultValue: 'Operational inboxes' })}
                        >
                            {currentHotel.emails && currentHotel.emails.length > 0 ? (
                                <div className="space-y-3">
                                    {currentHotel.emails.map((email, index) => (
                                        <div key={`${email.label}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">{email.label}</p>
                                                <p className="mt-1 truncate text-sm font-semibold text-brand-navy dark:text-brand-light">{email.address}</p>
                                            </div>
                                            <a
                                                href={`mailto:${email.address}`}
                                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint transition hover:bg-brand-mint hover:text-brand-light"
                                                aria-label={t('pages.hotel.actions.email', { defaultValue: 'Email contact' })}
                                            >
                                                <ArrowUpRight size={16} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/40 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                    {t('pages.hotel.cards.contacts.empty', { defaultValue: 'No contact email has been configured yet.' })}
                                </div>
                            )}
                        </DetailCard>

                        <DetailCard
                            icon={Landmark}
                            eyebrow={t('pages.hotel.cards.banking.eyebrow', { defaultValue: 'Finance' })}
                            title={t('pages.hotel.cards.banking.title', { defaultValue: 'Fiscal and banking profile' })}
                        >
                            <div className="space-y-3">
                                <InfoRow label={t('pages.hotel.fields.vatNumber', { defaultValue: 'VAT number' })} value={currentHotel.vatNumber} />
                                {(currentHotel.bankAccounts?.filter((account) => account.active) ?? []).length > 0 ? (
                                    currentHotel.bankAccounts
                                        ?.filter((account) => account.active)
                                        .map((account) => (
                                            <div key={account.id} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">{account.label}</p>
                                                        <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/65">{account.bankName || t('common.notAvailable', { defaultValue: 'Not provided' })}</p>
                                                    </div>
                                                    {account.isDefault && (
                                                        <span className="rounded-full bg-brand-mint/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-mint">
                                                            {t('pages.hotel.bankAccounts.principal', { defaultValue: 'Principal' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-3 space-y-1 font-mono text-xs text-brand-slate dark:text-brand-light/70">
                                                    <p>{account.rib || account.accountNumber || t('common.notAvailable', { defaultValue: 'Not provided' })}</p>
                                                    <p className="break-all">{account.iban || t('common.notAvailable', { defaultValue: 'Not provided' })}</p>
                                                    <p className="text-brand-mint">{account.swiftCode || t('common.notAvailable', { defaultValue: 'Not provided' })}</p>
                                                </div>
                                                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                                    {[account.currency, account.country].filter(Boolean).join(' / ') || t('common.notAvailable', { defaultValue: 'Not provided' })}
                                                </p>
                                            </div>
                                        ))
                                ) : (
                                    <div className="rounded-2xl bg-brand-navy px-4 py-4 text-brand-light">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                            {t('pages.hotel.fields.ibanSwift', { defaultValue: 'IBAN / SWIFT' })}
                                        </p>
                                        <p className="mt-2 break-all font-mono text-sm">{currentHotel.ibanCode || 'Not provided'}</p>
                                        <p className="mt-2 font-mono text-sm text-brand-mint">{currentHotel.swiftCode || 'Not provided'}</p>
                                    </div>
                                )}
                            </div>
                        </DetailCard>
                    </section>
                </div>
            )}

            {isAdmin && (
                <section className="premium-surface p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                {t('pages.hotel.archives.eyebrow', { defaultValue: 'Archive' })}
                            </p>
                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                {t('pages.hotel.archives.title', { defaultValue: 'Archived establishments' })}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowArchived(!showArchived)}
                            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                        >
                            <Archive size={16} />
                            {showArchived
                                ? t('pages.hotel.archives.hide', { defaultValue: 'Hide archive' })
                                : t('pages.hotel.archives.show', { defaultValue: 'Show archive' })}
                            <span className="text-brand-mint">({archivedHotels?.length || 0})</span>
                        </button>
                    </div>

                    {showArchived && archivedHotels && archivedHotels.length > 0 && (
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {archivedHotels.map((hotel) => (
                                <div key={hotel.id} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 shadow-sm grayscale transition hover:grayscale-0 dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-brand-navy dark:text-brand-light">{hotel.name}</h3>
                                            <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/75">{hotel.reference || 'REF-N/A'}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRestore(hotel)}
                                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint transition hover:bg-brand-mint hover:text-brand-light"
                                            aria-label={t('pages.hotel.actions.restore', { defaultValue: 'Restore hotel' })}
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                    <div className="mt-4 border-t border-brand-light/70 pt-4 dark:border-brand-light/10">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                            {t('pages.hotel.portfolio.columns.updatedBy', { defaultValue: 'Updated by' })}
                                        </p>
                                        <UpdatedByCell
                                            updatedByName={hotel.updatedByName}
                                            updatedAt={hotel.updatedAt}
                                            className="mt-2 min-w-0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <EditHotelModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editing={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
            <HotelLogoUploadModal
                isOpen={isLogoModalOpen}
                onClose={() => setIsLogoModalOpen(false)}
                hotelId={currentHotel?.id}
                hotelName={currentHotel?.name}
                currentLogoUrl={currentHotel?.logoUrl}
                onUploaded={() => setIsLogoModalOpen(false)}
            />
        </div>
    );
}
