import { useEffect, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarRange, ChevronDown, Mail, Pencil, Plus, Power, Search, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import UpdatedByCell from '../../../components/audit/UpdatedByCell';
import { useConfirm } from '../../../context/ConfirmContext';
import type { Affiliate } from '../types/affiliate.types';
import {
    useAffiliateEmailSpos,
    useBulkCreateAffiliateEmailSpo,
    useDeleteAffiliateEmailSpo,
    useUpdateAffiliateEmailSpo,
    type AffiliateEmailSpo,
} from '../hooks/useAffiliateEmailSpos';
import { useAffiliates } from '../hooks/useAffiliates';
import {
    createAffiliateEmailSpoSchema,
    type AffiliateEmailSpoFormInput,
    type AffiliateEmailSpoFormValues,
} from '../schemas/affiliate-email-spo.schema';

const cardSurfaceClasses = 'rounded-2xl border border-brand-light/70 bg-brand-light/70 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5';
const fieldClasses = 'w-full rounded-2xl border border-brand-light/70 bg-brand-light/95 px-4 py-3 text-sm text-brand-navy outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/60 dark:text-brand-light';

function defaultValues(): AffiliateEmailSpoFormInput {
    return {
        name: '',
        description: '',
        discountPercent: 5,
        applicationFrom: '',
        applicationTo: '',
        stackMode: 'ROLLING',
        applicationStep: 'AFTER_CONTRACT_SPO',
        status: 'ACTIVE',
    };
}

function getLocale(language: string) {
    return language.toLowerCase().startsWith('en') ? 'en-GB' : 'fr-FR';
}

function formatDate(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

function formatDateRange(from: string, to: string, locale: string) {
    return `${formatDate(from, locale)} - ${formatDate(to, locale)}`;
}

function getApiErrorMessage(error: unknown, fallback: string) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    const message = axiosError.response?.data?.message;

    if (Array.isArray(message) && message.length > 0) {
        return message.join(', ');
    }

    if (typeof message === 'string' && message.trim().length > 0) {
        return message;
    }

    return fallback;
}

interface EmailSpoFormModalProps {
    affiliateName: string;
    availableAffiliates: Affiliate[];
    currentAffiliateId: number;
    emailSpo?: AffiliateEmailSpo | null;
    errorMessage: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
    mode: 'create' | 'edit';
    onClose: () => void;
    onSubmit: (values: AffiliateEmailSpoFormValues, targetAffiliateIds: number[]) => Promise<void>;
}

function EmailSpoFormModal({
    affiliateName,
    availableAffiliates,
    currentAffiliateId,
    emailSpo = null,
    errorMessage,
    isOpen,
    isSubmitting,
    mode,
    onClose,
    onSubmit,
}: EmailSpoFormModalProps) {
    const { t, i18n } = useTranslation('common');
    const schema = useMemo(() => createAffiliateEmailSpoSchema(t), [t]);
    const fieldPrefix = useId();
    const [targetAffiliateIds, setTargetAffiliateIds] = useState<number[]>([]);
    const [targetSearch, setTargetSearch] = useState('');
    const [targetError, setTargetError] = useState<string | null>(null);
    const [isPartnerPickerOpen, setIsPartnerPickerOpen] = useState(false);
    const statusLabels = useMemo(
        () => ({
            ACTIVE: t('pages.affiliates.emailSpo.status.active', { defaultValue: 'Enabled' }),
            INACTIVE: t('pages.affiliates.emailSpo.status.inactive', { defaultValue: 'Disabled' }),
        }),
        [t],
    );
    const stackModeLabels = useMemo(
        () => ({
            ROLLING: t('pages.affiliates.emailSpo.stackMode.rolling', { defaultValue: 'Rolling' }),
            CUMULATIVE: t('pages.affiliates.emailSpo.stackMode.cumulative', { defaultValue: 'Cumulative' }),
        }),
        [t],
    );
    const stepLabels = useMemo(
        () => ({
            AFTER_BASE_RATE: t('pages.affiliates.emailSpo.applicationStep.afterBaseRate', { defaultValue: 'After base rate' }),
            AFTER_BOARD_SUPPLEMENT: t('pages.affiliates.emailSpo.applicationStep.afterBoardSupplement', { defaultValue: 'After board supplement' }),
            AFTER_SUPPLEMENT: t('pages.affiliates.emailSpo.applicationStep.afterSupplement', { defaultValue: 'After supplement' }),
            AFTER_REDUCTION: t('pages.affiliates.emailSpo.applicationStep.afterReduction', { defaultValue: 'After reduction' }),
            AFTER_MONOPARENTAL: t('pages.affiliates.emailSpo.applicationStep.afterMonoparental', { defaultValue: 'After monoparental' }),
            AFTER_EARLY_BOOKING: t('pages.affiliates.emailSpo.applicationStep.afterEarlyBooking', { defaultValue: 'After early booking' }),
            AFTER_CONTRACT_SPO: t('pages.affiliates.emailSpo.applicationStep.afterContractSpo', { defaultValue: 'After contract SPO' }),
        }),
        [t],
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AffiliateEmailSpoFormInput, unknown, AffiliateEmailSpoFormValues>({
        resolver: zodResolver(schema),
        defaultValues: defaultValues(),
    });

    useEffect(() => {
        if (!isOpen) {
            reset(defaultValues());
            setTargetAffiliateIds([]);
            setTargetSearch('');
            setTargetError(null);
            setIsPartnerPickerOpen(false);
            return;
        }

        if (mode === 'edit' && emailSpo) {
            reset({
                name: emailSpo.name,
                description: emailSpo.description ?? '',
                discountPercent: emailSpo.discountPercent,
                applicationFrom: emailSpo.applicationFrom.slice(0, 10),
                applicationTo: emailSpo.applicationTo.slice(0, 10),
                stackMode: emailSpo.stackMode,
                applicationStep: emailSpo.applicationStep,
                status: emailSpo.status,
            });
            setTargetAffiliateIds([currentAffiliateId]);
            setTargetSearch('');
            setTargetError(null);
            setIsPartnerPickerOpen(false);
            return;
        }

        reset(defaultValues());
        setTargetAffiliateIds([currentAffiliateId]);
        setTargetSearch('');
        setTargetError(null);
        setIsPartnerPickerOpen(false);
    }, [currentAffiliateId, emailSpo, isOpen, mode, reset]);

    if (!isOpen || (mode === 'edit' && !emailSpo)) {
        return null;
    }

    const locale = getLocale(i18n.language);
    const title = mode === 'create'
        ? t('pages.affiliates.emailSpo.modal.createTitle', { defaultValue: 'Create Email SPO' })
        : t('pages.affiliates.emailSpo.modal.editTitle', { defaultValue: 'Edit Email SPO' });
    const helperText = mode === 'create'
        ? t('pages.affiliates.emailSpo.modal.createHelper', {
            defaultValue: 'Create a temporary partner offer for {{partner}} without changing the signed contract.',
            partner: affiliateName,
        })
        : t('pages.affiliates.emailSpo.modal.editHelper', {
            defaultValue: 'Update the temporary partner offer for {{partner}} and keep the simulator rules aligned.',
            partner: affiliateName,
        });
    const submitLabel = mode === 'create'
        ? t('pages.affiliates.emailSpo.actions.create', { defaultValue: 'Create Email SPO' })
        : t('pages.affiliates.emailSpo.actions.saveChanges', { defaultValue: 'Save changes' });
    const targetAffiliates = availableAffiliates.length > 0
        ? availableAffiliates
        : [{ id: currentAffiliateId, companyName: affiliateName } as Affiliate];
    const visibleTargetAffiliates = targetAffiliates.filter((item) => {
        const query = targetSearch.trim().toLowerCase();

        if (!query) return true;

        return `${item.companyName} ${item.reference ?? ''}`.toLowerCase().includes(query);
    });
    const selectedTargetAffiliates = targetAffiliates.filter((item) => targetAffiliateIds.includes(item.id));
    const allVisibleSelected = visibleTargetAffiliates.length > 0
        && visibleTargetAffiliates.every((item) => targetAffiliateIds.includes(item.id));
    const toggleAffiliateTarget = (affiliateId: number) => {
        setTargetError(null);
        setTargetAffiliateIds((current) => (
            current.includes(affiliateId)
                ? current.filter((id) => id !== affiliateId)
                : [...current, affiliateId]
        ));
    };
    const toggleVisibleTargets = () => {
        setTargetError(null);
        const visibleIds = visibleTargetAffiliates.map((item) => item.id);

        setTargetAffiliateIds((current) => {
            if (allVisibleSelected) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };
    const submitForm = handleSubmit(async (values) => {
        if (mode === 'create' && targetAffiliateIds.length === 0) {
            setTargetError(t('pages.affiliates.emailSpo.errors.selectPartners', {
                defaultValue: 'Select at least one partner.',
            }));
            return;
        }

        await onSubmit(values, mode === 'create' ? targetAffiliateIds : [currentAffiliateId]);
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
            <div className="space-y-6">
                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/70 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-slate">
                        {affiliateName}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                        {helperText}
                    </p>
                    {mode === 'edit' && emailSpo && (
                        <p className="mt-3 text-xs font-medium text-brand-slate dark:text-brand-light/60">
                            {t('pages.affiliates.emailSpo.modal.editingPeriod', {
                                defaultValue: 'Current period: {{period}}',
                                period: formatDateRange(emailSpo.applicationFrom, emailSpo.applicationTo, locale),
                            })}
                        </p>
                    )}
                </div>

                <form onSubmit={submitForm} className="space-y-4" noValidate>
                    {errorMessage && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-brand-slate/20 bg-brand-slate/10 px-4 py-3 text-sm text-brand-navy dark:border-brand-slate/30 dark:bg-brand-slate/20 dark:text-brand-light"
                        >
                            {errorMessage}
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/65 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <label
                                        htmlFor={`${fieldPrefix}-partner-search`}
                                        className="flex items-center gap-2 text-sm font-semibold text-brand-navy dark:text-brand-light"
                                    >
                                        <Users size={16} className="text-brand-mint" />
                                        {t('pages.affiliates.emailSpo.fields.targetPartners', { defaultValue: 'Target partners' })}
                                    </label>
                                    <p className="mt-1 text-xs font-medium text-brand-slate dark:text-brand-light/70">
                                        {t('pages.affiliates.emailSpo.fields.targetPartnersHelper', {
                                            defaultValue: '{{count}} selected',
                                            count: targetAffiliateIds.length,
                                        })}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPartnerPickerOpen(true);
                                        toggleVisibleTargets();
                                    }}
                                    className="self-start rounded-2xl border border-brand-light/70 px-3 py-2 text-xs font-semibold text-brand-navy transition hover:border-brand-mint/40 hover:bg-brand-mint/10 dark:border-brand-light/10 dark:text-brand-light"
                                >
                                    {allVisibleSelected
                                        ? t('pages.affiliates.emailSpo.actions.clearVisiblePartners', { defaultValue: 'Clear visible' })
                                        : t('pages.affiliates.emailSpo.actions.selectVisiblePartners', { defaultValue: 'Select visible' })}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsPartnerPickerOpen((current) => !current)}
                                className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/95 px-4 py-3 text-left text-sm font-medium text-brand-navy transition hover:border-brand-mint/40 hover:bg-brand-mint/8 dark:border-brand-light/10 dark:bg-brand-navy/60 dark:text-brand-light"
                            >
                                <span className="min-w-0 flex-1 truncate">
                                    {selectedTargetAffiliates.length === 0
                                        ? t('pages.affiliates.emailSpo.fields.noPartnersSelected', { defaultValue: 'No partners selected' })
                                        : selectedTargetAffiliates.slice(0, 2).map((item) => item.companyName).join(', ')}
                                    {selectedTargetAffiliates.length > 2 ? ` +${selectedTargetAffiliates.length - 2}` : ''}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`shrink-0 text-brand-slate transition ${isPartnerPickerOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isPartnerPickerOpen && (
                                <div className="mt-3 rounded-2xl border border-brand-light/70 bg-brand-light/50 p-3 dark:border-brand-light/10 dark:bg-brand-navy/35">
                                    <div className="relative">
                                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                                        <input
                                            id={`${fieldPrefix}-partner-search`}
                                            value={targetSearch}
                                            onChange={(event) => setTargetSearch(event.target.value)}
                                            placeholder={t('pages.affiliates.emailSpo.fields.searchPartners', { defaultValue: 'Search partners' })}
                                            className="w-full rounded-2xl border border-brand-light/70 bg-brand-light/95 py-2.5 pl-9 pr-4 text-sm text-brand-navy outline-none transition placeholder:text-brand-slate/60 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/60 dark:text-brand-light"
                                        />
                                    </div>

                                    <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                                        {visibleTargetAffiliates.map((item) => (
                                            <label
                                                key={item.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2.5 text-sm font-medium text-brand-navy transition hover:border-brand-mint/30 hover:bg-brand-mint/8 dark:border-brand-light/10 dark:bg-brand-navy/40 dark:text-brand-light"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={targetAffiliateIds.includes(item.id)}
                                                    onChange={() => toggleAffiliateTarget(item.id)}
                                                    className="h-4 w-4 rounded border-brand-slate/40 text-brand-mint focus:ring-brand-mint"
                                                />
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.companyName}
                                                    {item.reference ? (
                                                        <span className="ml-2 text-xs text-brand-slate dark:text-brand-light/60">
                                                            {item.reference}
                                                        </span>
                                                    ) : null}
                                                </span>
                                                {item.id === currentAffiliateId && (
                                                    <span className="rounded-full bg-brand-mint/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-mint">
                                                        {t('pages.affiliates.emailSpo.fields.currentPartner', { defaultValue: 'Current' })}
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetError && (
                                <p className="mt-2 text-xs font-medium text-brand-slate dark:text-brand-light/70">
                                    {targetError}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor={`${fieldPrefix}-name`}
                            className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                        >
                            {t('pages.affiliates.emailSpo.fields.name', { defaultValue: 'Name' })}
                        </label>
                        <input
                            id={`${fieldPrefix}-name`}
                            {...register('name')}
                            aria-invalid={errors.name ? 'true' : 'false'}
                            aria-describedby={errors.name ? `${fieldPrefix}-name-error` : undefined}
                            className={fieldClasses}
                        />
                        {errors.name && (
                            <p id={`${fieldPrefix}-name-error`} className="mt-1.5 text-xs text-brand-slate dark:text-brand-light/70">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor={`${fieldPrefix}-discount`}
                                className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                            >
                                {t('pages.affiliates.emailSpo.fields.discountPercent', { defaultValue: 'Discount percent' })}
                            </label>
                            <input
                                id={`${fieldPrefix}-discount`}
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="100"
                                {...register('discountPercent')}
                                aria-invalid={errors.discountPercent ? 'true' : 'false'}
                                aria-describedby={errors.discountPercent ? `${fieldPrefix}-discount-error` : undefined}
                                className={fieldClasses}
                            />
                            {errors.discountPercent && (
                                <p id={`${fieldPrefix}-discount-error`} className="mt-1.5 text-xs text-brand-slate dark:text-brand-light/70">
                                    {errors.discountPercent.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor={`${fieldPrefix}-status`}
                                className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                            >
                                {t('pages.affiliates.emailSpo.fields.status', { defaultValue: 'Status' })}
                            </label>
                            <select id={`${fieldPrefix}-status`} {...register('status')} className={fieldClasses}>
                                <option value="ACTIVE">{statusLabels.ACTIVE}</option>
                                <option value="INACTIVE">{statusLabels.INACTIVE}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor={`${fieldPrefix}-from`}
                                className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                            >
                                {t('pages.affiliates.emailSpo.fields.applicationFrom', { defaultValue: 'Application from' })}
                            </label>
                            <input
                                id={`${fieldPrefix}-from`}
                                type="date"
                                {...register('applicationFrom')}
                                aria-invalid={errors.applicationFrom ? 'true' : 'false'}
                                aria-describedby={errors.applicationFrom ? `${fieldPrefix}-from-error` : undefined}
                                className={fieldClasses}
                            />
                            {errors.applicationFrom && (
                                <p id={`${fieldPrefix}-from-error`} className="mt-1.5 text-xs text-brand-slate dark:text-brand-light/70">
                                    {errors.applicationFrom.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor={`${fieldPrefix}-to`}
                                className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                            >
                                {t('pages.affiliates.emailSpo.fields.applicationTo', { defaultValue: 'Application to' })}
                            </label>
                            <input
                                id={`${fieldPrefix}-to`}
                                type="date"
                                {...register('applicationTo')}
                                aria-invalid={errors.applicationTo ? 'true' : 'false'}
                                aria-describedby={errors.applicationTo ? `${fieldPrefix}-to-error` : undefined}
                                className={fieldClasses}
                            />
                            {errors.applicationTo && (
                                <p id={`${fieldPrefix}-to-error`} className="mt-1.5 text-xs text-brand-slate dark:text-brand-light/70">
                                    {errors.applicationTo.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor={`${fieldPrefix}-stack-mode`}
                                className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                            >
                                {t('pages.affiliates.emailSpo.fields.stackMode', { defaultValue: 'Stack mode' })}
                            </label>
                            <select id={`${fieldPrefix}-stack-mode`} {...register('stackMode')} className={fieldClasses}>
                                <option value="ROLLING">{stackModeLabels.ROLLING}</option>
                                <option value="CUMULATIVE">{stackModeLabels.CUMULATIVE}</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor={`${fieldPrefix}-step`}
                                className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                            >
                                {t('pages.affiliates.emailSpo.fields.applicationStep', { defaultValue: 'Calculation position' })}
                            </label>
                            <select id={`${fieldPrefix}-step`} {...register('applicationStep')} className={fieldClasses}>
                                {Object.entries(stepLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor={`${fieldPrefix}-description`}
                            className="mb-1.5 block text-sm font-medium text-brand-navy dark:text-brand-light"
                        >
                            {t('pages.affiliates.emailSpo.fields.note', { defaultValue: 'Note' })}
                        </label>
                        <textarea
                            id={`${fieldPrefix}-description`}
                            rows={4}
                            {...register('description')}
                            className={`${fieldClasses} resize-none`}
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-brand-light/70 pt-4 sm:flex-row sm:justify-end dark:border-brand-light/10">
                        <Button type="button" variant="secondary" onClick={onClose} className="rounded-2xl">
                            {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-2xl px-5"
                            aria-label={submitLabel}
                        >
                            {isSubmitting
                                ? t('pages.affiliates.emailSpo.actions.saving', { defaultValue: 'Saving...' })
                                : submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

interface EmailSpoCardProps {
    actionState: {
        isDeleting: boolean;
        isTogglingStatus: boolean;
    };
    item: AffiliateEmailSpo;
    locale: string;
    onDelete: (item: AffiliateEmailSpo) => Promise<void>;
    onEdit: (item: AffiliateEmailSpo) => void;
    onToggleStatus: (item: AffiliateEmailSpo) => Promise<void>;
    statusLabels: Record<'ACTIVE' | 'INACTIVE', string>;
    stepLabels: Record<AffiliateEmailSpo['applicationStep'], string>;
    t: ReturnType<typeof useTranslation>['t'];
}

function EmailSpoCard({
    actionState,
    item,
    locale,
    onDelete,
    onEdit,
    onToggleStatus,
    statusLabels,
    stepLabels,
    t,
}: EmailSpoCardProps) {
    const statusTone = item.status === 'ACTIVE'
        ? 'bg-brand-mint/12 text-brand-mint ring-1 ring-brand-mint/20'
        : 'bg-brand-slate/12 text-brand-slate dark:text-brand-light/70 ring-1 ring-brand-slate/15';
    const stackModeTone = item.stackMode === 'ROLLING'
        ? 'bg-brand-navy/8 text-brand-navy ring-1 ring-brand-navy/10 dark:bg-brand-light/10 dark:text-brand-light dark:ring-brand-light/10'
        : 'bg-brand-light text-brand-navy ring-1 ring-brand-light/80 dark:bg-brand-light/10 dark:text-brand-light dark:ring-brand-light/10';
    return (
        <article className={`${cardSurfaceClasses} flex h-full flex-col p-4 sm:p-5`}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-slate">
                        {t('pages.affiliates.emailSpo.card.label', { defaultValue: 'Email SPO' })}
                    </p>
                    <h3 className="mt-1 break-words text-base font-semibold text-brand-navy dark:text-brand-light">
                        {item.name}
                    </h3>
                    {item.description && (
                        <p className="mt-2 break-words text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                            {item.description}
                        </p>
                    )}
                </div>

                <div className="shrink-0 rounded-2xl bg-brand-mint/10 px-3 py-2 text-right dark:bg-brand-mint/12">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                        {t('pages.affiliates.emailSpo.card.discount', { defaultValue: 'Discount' })}
                    </span>
                    <span className="text-2xl font-bold text-brand-mint">{item.discountPercent}%</span>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone}`}>
                    {statusLabels[item.status]}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${stackModeTone}`}>
                    {item.stackMode === 'ROLLING'
                        ? t('pages.affiliates.emailSpo.stackMode.rolling', { defaultValue: 'Rolling' })
                        : t('pages.affiliates.emailSpo.stackMode.cumulative', { defaultValue: 'Cumulative' })}
                </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-brand-light/90 px-3 py-3 dark:bg-brand-navy/45">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-slate">
                        {t('pages.affiliates.emailSpo.card.period', { defaultValue: 'Application period' })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-navy dark:text-brand-light">
                        {formatDateRange(item.applicationFrom, item.applicationTo, locale)}
                    </p>
                </div>

                <div className="rounded-2xl bg-brand-light/90 px-3 py-3 dark:bg-brand-navy/45">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-slate">
                        {t('pages.affiliates.emailSpo.card.position', { defaultValue: 'Calculation position' })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-navy dark:text-brand-light">
                        {stepLabels[item.applicationStep]}
                    </p>
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-2 border-t border-brand-light/70 pt-3 dark:border-brand-light/10">
                {(item.updatedByName || item.updatedAt) && (
                    <div className="rounded-2xl bg-brand-light/90 px-3 py-3 dark:bg-brand-navy/45">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-slate">
                            {t('pages.affiliates.emailSpo.card.updated', { defaultValue: 'Updated' })}
                        </p>
                        <UpdatedByCell updatedByName={item.updatedByName} updatedAt={item.updatedAt} className="min-w-0" />
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-brand-light/70 px-3 py-2 text-sm font-medium text-brand-navy transition hover:border-brand-mint/40 hover:bg-brand-mint/10 dark:border-brand-light/10 dark:text-brand-light dark:hover:bg-brand-light/10"
                        aria-label={t('pages.affiliates.emailSpo.actions.editItem', {
                            defaultValue: 'Edit Email SPO {{name}}',
                            name: item.name,
                        })}
                    >
                        <Pencil size={15} />
                        {t('actions.edit', { defaultValue: 'Edit' })}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            void onToggleStatus(item);
                        }}
                        disabled={actionState.isTogglingStatus}
                        className="inline-flex items-center gap-2 rounded-2xl border border-brand-light/70 px-3 py-2 text-sm font-medium text-brand-slate transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-light/10 dark:text-brand-light/80 dark:hover:bg-brand-light/10"
                        aria-label={item.status === 'ACTIVE'
                            ? t('pages.affiliates.emailSpo.actions.disableItem', {
                                defaultValue: 'Disable Email SPO {{name}}',
                                name: item.name,
                            })
                            : t('pages.affiliates.emailSpo.actions.activateItem', {
                                defaultValue: 'Enable Email SPO {{name}}',
                                name: item.name,
                            })}
                    >
                        <Power size={15} />
                        {actionState.isTogglingStatus
                            ? t('pages.affiliates.emailSpo.actions.saving', { defaultValue: 'Saving...' })
                            : item.status === 'ACTIVE'
                                ? t('pages.affiliates.emailSpo.actions.disable', { defaultValue: 'Disable' })
                                : t('pages.affiliates.emailSpo.actions.activate', { defaultValue: 'Enable' })}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            void onDelete(item);
                        }}
                        disabled={actionState.isDeleting}
                        className="inline-flex items-center gap-2 rounded-2xl border border-brand-slate/20 px-3 py-2 text-sm font-medium text-brand-slate transition hover:bg-brand-slate/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-slate/30 dark:text-brand-light/80 dark:hover:bg-brand-slate/20"
                        aria-label={t('pages.affiliates.emailSpo.actions.deleteItem', {
                            defaultValue: 'Delete Email SPO {{name}}',
                            name: item.name,
                        })}
                    >
                        <Trash2 size={15} />
                        {actionState.isDeleting
                            ? t('pages.affiliates.emailSpo.actions.deleting', { defaultValue: 'Deleting...' })
                            : t('actions.delete', { defaultValue: 'Delete' })}
                    </button>
                </div>
            </div>
        </article>
    );
}

interface AffiliateEmailSpoManagerModalProps {
    affiliate: Affiliate | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AffiliateEmailSpoManagerModal({
    affiliate,
    isOpen,
    onClose,
}: AffiliateEmailSpoManagerModalProps) {
    const { t, i18n } = useTranslation('common');
    const { confirm } = useConfirm();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEmailSpoId, setEditingEmailSpoId] = useState<number | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [statusActionId, setStatusActionId] = useState<number | null>(null);
    const [deleteActionId, setDeleteActionId] = useState<number | null>(null);

    const affiliateId = affiliate?.id ?? null;
    const locale = getLocale(i18n.language);
    const { data: emailSpos, isLoading, isError } = useAffiliateEmailSpos(affiliateId, isOpen);
    const { data: affiliates = [] } = useAffiliates();
    const availableAffiliates = useMemo(() => {
        if (!affiliate || affiliates.some((item) => item.id === affiliate.id)) {
            return affiliates;
        }

        return [affiliate, ...affiliates];
    }, [affiliate, affiliates]);
    const bulkCreateMutation = useBulkCreateAffiliateEmailSpo();
    const updateMutation = useUpdateAffiliateEmailSpo(affiliateId);
    const statusMutation = useUpdateAffiliateEmailSpo(affiliateId);
    const deleteMutation = useDeleteAffiliateEmailSpo(affiliateId);

    const statusLabels = useMemo(
        () => ({
            ACTIVE: t('pages.affiliates.emailSpo.status.active', { defaultValue: 'Enabled' }),
            INACTIVE: t('pages.affiliates.emailSpo.status.inactive', { defaultValue: 'Disabled' }),
        }),
        [t],
    );
    const stepLabels = useMemo(
        () => ({
            AFTER_BASE_RATE: t('pages.affiliates.emailSpo.applicationStep.afterBaseRate', { defaultValue: 'After base rate' }),
            AFTER_BOARD_SUPPLEMENT: t('pages.affiliates.emailSpo.applicationStep.afterBoardSupplement', { defaultValue: 'After board supplement' }),
            AFTER_SUPPLEMENT: t('pages.affiliates.emailSpo.applicationStep.afterSupplement', { defaultValue: 'After supplement' }),
            AFTER_REDUCTION: t('pages.affiliates.emailSpo.applicationStep.afterReduction', { defaultValue: 'After reduction' }),
            AFTER_MONOPARENTAL: t('pages.affiliates.emailSpo.applicationStep.afterMonoparental', { defaultValue: 'After monoparental' }),
            AFTER_EARLY_BOOKING: t('pages.affiliates.emailSpo.applicationStep.afterEarlyBooking', { defaultValue: 'After early booking' }),
            AFTER_CONTRACT_SPO: t('pages.affiliates.emailSpo.applicationStep.afterContractSpo', { defaultValue: 'After contract SPO' }),
        }),
        [t],
    );
    const selectedEmailSpo = useMemo(
        () => emailSpos?.find((item) => item.id === editingEmailSpoId) ?? null,
        [editingEmailSpoId, emailSpos],
    );

    useEffect(() => {
        if (!isOpen) {
            setIsCreateModalOpen(false);
            setEditingEmailSpoId(null);
            setCreateError(null);
            setUpdateError(null);
            setStatusActionId(null);
            setDeleteActionId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingEmailSpoId && !isLoading && emailSpos && !selectedEmailSpo) {
            setEditingEmailSpoId(null);
            setUpdateError(null);
        }
    }, [editingEmailSpoId, emailSpos, isLoading, selectedEmailSpo]);

    if (!affiliate) {
        return null;
    }

    const openCreateModal = () => {
        setEditingEmailSpoId(null);
        setUpdateError(null);
        setCreateError(null);
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setCreateError(null);
        setIsCreateModalOpen(false);
    };

    const openEditModal = (item: AffiliateEmailSpo) => {
        setCreateError(null);
        setUpdateError(null);
        setIsCreateModalOpen(false);
        setEditingEmailSpoId(item.id);
    };

    const closeEditModal = () => {
        setUpdateError(null);
        setEditingEmailSpoId(null);
    };

    const handleCreateSubmit = async (values: AffiliateEmailSpoFormValues, targetAffiliateIds: number[]) => {
        setCreateError(null);

        try {
            await bulkCreateMutation.mutateAsync({
                ...values,
                affiliateIds: targetAffiliateIds,
            });
            closeCreateModal();
        } catch (error) {
            setCreateError(
                getApiErrorMessage(
                    error,
                    t('pages.affiliates.emailSpo.errors.create', {
                        defaultValue: 'Unable to create the Email SPO right now.',
                    }),
                ),
            );
        }
    };

    const handleUpdateSubmit = async (values: AffiliateEmailSpoFormValues) => {
        if (!selectedEmailSpo) {
            return;
        }

        setUpdateError(null);

        try {
            await updateMutation.mutateAsync({ emailSpoId: selectedEmailSpo.id, data: values });
            closeEditModal();
        } catch (error) {
            setUpdateError(
                getApiErrorMessage(
                    error,
                    t('pages.affiliates.emailSpo.errors.update', {
                        defaultValue: 'Unable to update the Email SPO right now.',
                    }),
                ),
            );
        }
    };

    const handleToggleStatus = async (item: AffiliateEmailSpo) => {
        const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const confirmed = await confirm({
            title: nextStatus === 'INACTIVE'
                ? t('pages.affiliates.emailSpo.confirm.disableTitle', {
                    defaultValue: 'Disable "{{name}}"?',
                    name: item.name,
                })
                : t('pages.affiliates.emailSpo.confirm.activateTitle', {
                    defaultValue: 'Enable "{{name}}"?',
                    name: item.name,
                }),
            description: nextStatus === 'INACTIVE'
                ? t('pages.affiliates.emailSpo.confirm.disableDescription', {
                    defaultValue: 'This Email SPO will stop applying in simulation.',
                })
                : t('pages.affiliates.emailSpo.confirm.activateDescription', {
                    defaultValue: 'This Email SPO will be eligible in simulation again.',
                }),
            confirmLabel: nextStatus === 'INACTIVE'
                ? t('pages.affiliates.emailSpo.actions.disable', { defaultValue: 'Disable' })
                : t('pages.affiliates.emailSpo.actions.activate', { defaultValue: 'Enable' }),
            variant: nextStatus === 'INACTIVE' ? 'danger' : 'info',
        });

        if (!confirmed) {
            return;
        }

        setStatusActionId(item.id);
        try {
            await statusMutation.mutateAsync({ emailSpoId: item.id, data: { status: nextStatus } });
        } finally {
            setStatusActionId(null);
        }
    };

    const handleDelete = async (item: AffiliateEmailSpo) => {
        const confirmed = await confirm({
            title: t('pages.affiliates.emailSpo.confirm.deleteTitle', {
                defaultValue: 'Delete "{{name}}"?',
                name: item.name,
            }),
            description: t('pages.affiliates.emailSpo.confirm.deleteDescription', {
                defaultValue: 'This Email SPO will be permanently removed.',
            }),
            confirmLabel: t('actions.delete', { defaultValue: 'Delete' }),
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setDeleteActionId(item.id);

        try {
            await deleteMutation.mutateAsync(item.id);
            if (editingEmailSpoId === item.id) {
                closeEditModal();
            }
        } finally {
            setDeleteActionId(null);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={t('pages.affiliates.emailSpo.manager.title', { defaultValue: 'Partner Email SPO' })}
                maxWidth="max-w-5xl"
            >
                <div className="space-y-6">
                    <div className={`${cardSurfaceClasses} p-5`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-slate">
                                    {affiliate.companyName}
                                </p>
                                <h3 className="mt-2 text-xl font-semibold text-brand-navy dark:text-brand-light">
                                    {t('pages.affiliates.emailSpo.manager.heading', { defaultValue: 'Temporary partner offers' })}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                                    {t('pages.affiliates.emailSpo.manager.helper', {
                                        defaultValue: 'Configure temporary Email SPO offers that apply in the simulator for this partner without modifying the signed contract.',
                                    })}
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={openCreateModal}
                                className="shrink-0 rounded-2xl px-4 py-2.5"
                            >
                                <Plus size={16} className="mr-2" />
                                {t('pages.affiliates.emailSpo.actions.create', { defaultValue: 'Create Email SPO' })}
                            </Button>
                        </div>
                    </div>

                    {isLoading && (
                        <div className={`${cardSurfaceClasses} px-5 py-8 text-sm text-brand-slate dark:text-brand-light/70`}>
                            {t('pages.affiliates.emailSpo.state.loading', { defaultValue: 'Loading Email SPO offers...' })}
                        </div>
                    )}

                    {isError && (
                        <div className={`${cardSurfaceClasses} px-5 py-8 text-sm text-brand-slate dark:text-brand-light/70`}>
                            {t('pages.affiliates.emailSpo.state.error', { defaultValue: 'Unable to load Email SPO offers.' })}
                        </div>
                    )}

                    {!isLoading && !isError && (!emailSpos || emailSpos.length === 0) && (
                        <div className={`${cardSurfaceClasses} flex flex-col items-center justify-center px-6 py-12 text-center`}>
                            <div className="rounded-2xl bg-brand-mint/10 p-3 text-brand-mint dark:bg-brand-mint/15">
                                <Mail size={22} />
                            </div>
                            <h4 className="mt-4 text-base font-semibold text-brand-navy dark:text-brand-light">
                                {t('pages.affiliates.emailSpo.state.emptyTitle', { defaultValue: 'No Email SPO configured for this partner yet.' })}
                            </h4>
                            <p className="mt-2 max-w-md text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                                {t('pages.affiliates.emailSpo.state.emptyDescription', {
                                    defaultValue: 'Create a temporary Email SPO to target this partner during a specific stay period.',
                                })}
                            </p>
                            <Button type="button" onClick={openCreateModal} className="mt-5 rounded-2xl px-4 py-2.5">
                                <Plus size={16} className="mr-2" />
                                {t('pages.affiliates.emailSpo.actions.create', { defaultValue: 'Create Email SPO' })}
                            </Button>
                        </div>
                    )}

                    {!isLoading && !isError && emailSpos && emailSpos.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-brand-slate dark:text-brand-light/70">
                                <CalendarRange size={15} className="text-brand-mint" />
                                <span>
                                    {t('pages.affiliates.emailSpo.manager.count', {
                                        defaultValue: '{{count}} Email SPO configured',
                                        count: emailSpos.length,
                                    })}
                                </span>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {emailSpos.map((item) => (
                                    <EmailSpoCard
                                        key={item.id}
                                        item={item}
                                        locale={locale}
                                        onDelete={handleDelete}
                                        onEdit={openEditModal}
                                        onToggleStatus={handleToggleStatus}
                                        statusLabels={statusLabels}
                                        stepLabels={stepLabels}
                                        t={t}
                                        actionState={{
                                            isDeleting: deleteActionId === item.id && deleteMutation.isPending,
                                            isTogglingStatus: statusActionId === item.id && statusMutation.isPending,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <EmailSpoFormModal
                affiliateName={affiliate.companyName}
                availableAffiliates={availableAffiliates}
                currentAffiliateId={affiliate.id}
                errorMessage={createError}
                isOpen={isCreateModalOpen}
                isSubmitting={bulkCreateMutation.isPending}
                mode="create"
                onClose={closeCreateModal}
                onSubmit={handleCreateSubmit}
            />

            <EmailSpoFormModal
                affiliateName={affiliate.companyName}
                availableAffiliates={availableAffiliates}
                currentAffiliateId={affiliate.id}
                emailSpo={selectedEmailSpo}
                errorMessage={updateError}
                isOpen={editingEmailSpoId !== null && !!selectedEmailSpo}
                isSubmitting={updateMutation.isPending}
                mode="edit"
                onClose={closeEditModal}
                onSubmit={handleUpdateSubmit}
            />
        </>
    );
}
