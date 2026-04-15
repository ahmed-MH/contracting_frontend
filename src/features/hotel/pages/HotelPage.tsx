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
import { useConfirm } from '../../../context/ConfirmContext';
import { useHotel } from '../context/HotelContext';
import {
    Archive,
    ArrowUpRight,
    Building2,
    ChevronDown,
    Coins,
    Hotel as HotelIcon,
    Landmark,
    Mail,
    MapPin,
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
import { GuidedPageHeader } from '../../../components/layout/Workspace';

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

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                {label}
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-brand-navy dark:text-brand-light">
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
    const [editing, setEditing] = useState<Hotel | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const { currentHotel, availableHotels, switchHotel, isLoading: isContextLoading } = useHotel();

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
                            { label: t('pages.hotel.metrics.activeProperties', { defaultValue: 'Active properties' }), value: availableHotels.length, icon: HotelIcon },
                            { label: t('pages.hotel.metrics.contactEmails', { defaultValue: 'Contact emails' }), value: currentHotel.emails?.length ?? 0, icon: Mail },
                            { label: t('pages.hotel.metrics.defaultCurrency', { defaultValue: 'Default currency' }), value: currentHotel.defaultCurrency, icon: Coins },
                            { label: t('pages.hotel.metrics.rating', { defaultValue: 'Rating' }), value: currentHotel.stars ? `${currentHotel.stars} stars` : 'Unrated', icon: Star },
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

                    <section className="grid gap-6 xl:grid-cols-3">
                        <DetailCard
                            icon={MapPin}
                            eyebrow={t('pages.hotel.cards.location.eyebrow', { defaultValue: 'Location' })}
                            title={t('pages.hotel.cards.location.title', { defaultValue: 'Property coordinates' })}
                        >
                            <div className="space-y-3">
                                <InfoRow label={t('pages.hotel.fields.address', { defaultValue: 'Address' })} value={currentHotel.address} />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoRow label={t('pages.hotel.fields.phone', { defaultValue: 'Phone' })} value={currentHotel.phone} />
                                    <InfoRow label={t('pages.hotel.fields.fax', { defaultValue: 'Fax' })} value={currentHotel.fax} />
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
                                <InfoRow label={t('pages.hotel.fields.bank', { defaultValue: 'Bank' })} value={currentHotel.bankName} />
                                <InfoRow label={t('pages.hotel.fields.vatNumber', { defaultValue: 'VAT number' })} value={currentHotel.vatNumber} />
                                <InfoRow label={t('pages.hotel.fields.accountNumber', { defaultValue: 'Account number' })} value={currentHotel.accountNumber} />
                                <div className="rounded-2xl bg-brand-navy px-4 py-4 text-brand-light">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                        {t('pages.hotel.fields.ibanSwift', { defaultValue: 'IBAN / SWIFT' })}
                                    </p>
                                    <p className="mt-2 break-all font-mono text-sm">{currentHotel.ibanCode || 'Not provided'}</p>
                                    <p className="mt-2 font-mono text-sm text-brand-mint">{currentHotel.swiftCode || 'Not provided'}</p>
                                </div>
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
        </div>
    );
}
