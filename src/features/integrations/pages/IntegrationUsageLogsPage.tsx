import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useHotels } from '../../hotel/hooks/useHotels';
import Modal from '../../../components/ui/Modal';
import {
    IntegrationCodeBlock,
    IntegrationDetailTile,
    IntegrationEmptyState,
    IntegrationHero,
    IntegrationLogResultBadge,
    IntegrationSectionCard,
} from '../components/IntegrationUi';
import { useIntegrationApiUsers, useIntegrationEndpoints, useIntegrationUsageLogs } from '../hooks/useIntegrations';
import type { IntegrationPlaygroundRequest, IntegrationUsageLog, IntegrationUsageLogFilters } from '../types/integrations.types';

const formatDateTime = (value: string, locale: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const filterLabelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-brand-slate dark:text-brand-light/50';
const filterControlClass = 'h-11 w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 text-sm shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5';

export default function IntegrationUsageLogsPage() {
    const { t, i18n } = useTranslation('common');
    const navigate = useNavigate();
    const { data: apiUsers = [] } = useIntegrationApiUsers();
    const { data: endpoints = [] } = useIntegrationEndpoints();
    const { data: hotels = [] } = useHotels();
    const [filters, setFilters] = useState<IntegrationUsageLogFilters>({});
    const [selectedLog, setSelectedLog] = useState<IntegrationUsageLog | null>(null);
    const { data: logs = [], isLoading } = useIntegrationUsageLogs(filters);

    const updateFilter = <K extends keyof IntegrationUsageLogFilters>(key: K, value: IntegrationUsageLogFilters[K]) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.logs.header.eyebrow')}
                title={t('pages.integrations.logs.header.title')}
                description={t('pages.integrations.logs.header.subtitle')}
                badge={t('pages.integrations.logs.header.badge', { count: logs.length })}
            />

            <IntegrationSectionCard
                eyebrow={t('pages.integrations.logs.filters.eyebrow')}
                title={t('pages.integrations.logs.filters.title')}
                description={t('pages.integrations.logs.filters.description')}
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block">
                        <span className={filterLabelClass}>Endpoint</span>
                        <select className={filterControlClass} onChange={(event) => updateFilter('endpointCode', event.target.value || undefined)}>
                            <option value="">{t('pages.integrations.logs.filters.allEndpoints')}</option>
                            {endpoints.map((endpoint) => (
                                <option key={endpoint.id} value={endpoint.code}>{endpoint.code}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className={filterLabelClass}>API user</span>
                        <select className={filterControlClass} onChange={(event) => updateFilter('apiUserId', event.target.value ? Number(event.target.value) : undefined)}>
                            <option value="">{t('pages.integrations.logs.filters.allUsers')}</option>
                            {apiUsers.map((apiUser) => (
                                <option key={apiUser.id} value={apiUser.id}>{apiUser.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className={filterLabelClass}>Hotel</span>
                        <select className={filterControlClass} onChange={(event) => updateFilter('hotelId', event.target.value ? Number(event.target.value) : undefined)}>
                            <option value="">{t('pages.integrations.logs.filters.allHotels')}</option>
                            {hotels.map((hotel) => (
                                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className={filterLabelClass}>Result</span>
                        <select className={filterControlClass} onChange={(event) => updateFilter('success', event.target.value === '' ? undefined : event.target.value === 'true')}>
                            <option value="">{t('pages.integrations.logs.filters.allResults')}</option>
                            <option value="true">{t('pages.integrations.logs.filters.successOnly')}</option>
                            <option value="false">{t('pages.integrations.logs.filters.failureOnly')}</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className={filterLabelClass}>Date from</span>
                        <input type="date" className={filterControlClass} onChange={(event) => updateFilter('dateFrom', event.target.value || undefined)} />
                    </label>
                    <label className="block">
                        <span className={filterLabelClass}>Date to</span>
                        <input type="date" className={filterControlClass} onChange={(event) => updateFilter('dateTo', event.target.value || undefined)} />
                    </label>
                </div>
            </IntegrationSectionCard>

            <IntegrationSectionCard
                eyebrow={t('pages.integrations.logs.table.eyebrow')}
                title={t('pages.integrations.logs.table.title')}
                description={t('pages.integrations.logs.table.description')}
            >
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                    </div>
                ) : logs.length === 0 ? (
                    <IntegrationEmptyState title={t('pages.integrations.logs.table.empty')} />
                ) : (
                    <div className="overflow-hidden rounded-[1.5rem] border border-brand-light/70 bg-brand-light/60 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/75 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="w-48 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.logs.table.date')}</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.logs.table.endpoint')}</th>
                                        <th className="w-[24%] whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.logs.table.apiUser')}</th>
                                        <th className="w-48 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.logs.table.result')}</th>
                                        <th className="w-32 whitespace-nowrap px-5 py-3 font-semibold uppercase tracking-[0.16em]">{t('pages.integrations.logs.table.duration')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            onClick={() => setSelectedLog(log)}
                                            className="cursor-pointer bg-brand-light/35 transition hover:bg-brand-light/80 focus-within:bg-brand-light/80 dark:bg-transparent dark:hover:bg-brand-light/6"
                                        >
                                            <td className="px-5 py-3 align-middle">{formatDateTime(log.createdAt, i18n.language)}</td>
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-mono text-xs font-semibold text-brand-navy dark:text-brand-light">{log.endpointCode}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <p className="font-medium text-brand-navy dark:text-brand-light">{log.apiUser?.name ?? t('pages.integrations.common.emptyValue')}</p>
                                            </td>
                                            <td className="px-5 py-3 align-middle">
                                                <IntegrationLogResultBadge success={log.success} statusCode={log.statusCode} errorCode={log.errorCode} />
                                            </td>
                                            <td className="px-5 py-3 align-middle">{t('pages.integrations.logs.table.durationValue', { value: log.durationMs })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </IntegrationSectionCard>

            <UsageLogDrawer
                log={selectedLog}
                onClose={() => setSelectedLog(null)}
                emptyLabel={t('pages.integrations.common.emptyValue')}
                onOpenInPlayground={(payload) => {
                    navigate('/admin/integrations/playground', {
                        state: {
                            prefillPayload: payload,
                            hotelId: selectedLog?.hotel?.id ?? null,
                        },
                    });
                }}
                formatDate={(value) => formatDateTime(value, i18n.language)}
            />
        </div>
    );
}

function UsageLogDrawer({
    log,
    onClose,
    emptyLabel,
    onOpenInPlayground,
    formatDate,
}: {
    log: IntegrationUsageLog | null;
    onClose: () => void;
    emptyLabel: string;
    onOpenInPlayground: (payload: IntegrationPlaygroundRequest) => void;
    formatDate: (value: string) => string;
}) {
    const { t } = useTranslation('common');
    const requestPayload = toQuotePayload(log?.requestJson);

    return (
        <Modal
            isOpen={!!log}
            onClose={onClose}
            title={t('pages.integrations.logs.drawer.title')}
            maxWidth="max-w-5xl"
        >
            {log ? (
                <div className="space-y-5">
                    <DrawerSection title={t('pages.integrations.logs.drawer.sections.requestMetadata')}>
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.endpointCode')} value={log.endpointCode} mono />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.hotel')} value={log.hotel?.name ?? emptyLabel} />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.requestId')} value={log.requestId ?? emptyLabel} mono />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.reservationCode')} value={log.externalReservationCode ?? emptyLabel} mono />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.statusCode')} value={String(log.statusCode)} />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.result')} value={<IntegrationLogResultBadge success={log.success} statusCode={log.statusCode} errorCode={log.errorCode} />} />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.errorCode')} value={log.errorCode ?? emptyLabel} mono tone={log.errorCode ? 'danger' : 'neutral'} />
                    </DrawerSection>

                    <DrawerSection title={t('pages.integrations.logs.drawer.sections.securityContext')}>
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.apiUser')} value={log.apiUser?.name ?? emptyLabel} />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.apiKeyPrefix')} value={log.apiKey?.prefix ?? emptyLabel} mono />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.environment')} value={log.apiKeyEnvironment ?? log.apiKey?.environment ?? emptyLabel} />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.ipAddress')} value={log.ipAddress ?? emptyLabel} mono />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.source')} value={log.source ?? emptyLabel} />
                    </DrawerSection>

                    <DrawerSection title={t('pages.integrations.logs.drawer.sections.timing')}>
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.durationMs')} value={`${log.durationMs} ms`} />
                        <IntegrationDetailTile label={t('pages.integrations.logs.drawer.createdAt')} value={formatDate(log.createdAt)} />
                    </DrawerSection>

                    {log.errorMessage ? (
                        <div className="rounded-2xl border border-brand-coral/30 bg-brand-coral/10 p-4 text-sm text-brand-coral">
                            {log.errorMessage}
                        </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                        <JsonBlock title={t('pages.integrations.logs.drawer.requestJson')} value={log.requestJson} emptyLabel={emptyLabel} />
                        <JsonBlock title={t('pages.integrations.logs.drawer.responseJson')} value={log.responseJson} emptyLabel={emptyLabel} />
                    </div>

                    <div className="flex justify-end border-t border-brand-slate/15 pt-4 dark:border-brand-slate/20">
                        <button
                            type="button"
                            disabled={!requestPayload}
                            onClick={() => requestPayload && onOpenInPlayground(requestPayload)}
                            className="rounded-2xl bg-brand-mint px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint disabled:opacity-50"
                        >
                            {t('pages.integrations.logs.drawer.openInPlayground')}
                        </button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div>
            <h3 className="mb-3 text-sm font-semibold text-brand-navy dark:text-brand-light">{title}</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
        </div>
    );
}

function JsonBlock({ title, value, emptyLabel }: { title: string; value?: Record<string, unknown> | null; emptyLabel: string }) {
    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-brand-navy dark:text-brand-light">{title}</p>
            {value ? (
                <IntegrationCodeBlock value={JSON.stringify(value, null, 2)} />
            ) : (
                <IntegrationEmptyState title={emptyLabel} />
            )}
        </div>
    );
}

function toQuotePayload(value: unknown): IntegrationPlaygroundRequest | null {
    if (!value || typeof value !== 'object') return null;
    const payload = value as Partial<Record<keyof IntegrationPlaygroundRequest, unknown>>;
    const {
        requestId,
        hotelCode,
        partnerCode,
        reservationDate,
        checkIn,
        checkOut,
        currency,
        roomTypeCode,
        boardCode,
        adults,
        childrenAges,
    } = payload;
    const isValid = typeof requestId === 'string'
        && typeof hotelCode === 'string'
        && typeof partnerCode === 'string'
        && typeof reservationDate === 'string'
        && typeof checkIn === 'string'
        && typeof checkOut === 'string'
        && typeof currency === 'string'
        && typeof roomTypeCode === 'string'
        && typeof boardCode === 'string'
        && typeof adults === 'number'
        && (payload.childrenAges === undefined || Array.isArray(payload.childrenAges));

    if (!isValid) return null;

    return {
        requestId,
        hotelCode,
        partnerCode,
        reservationDate,
        checkIn,
        checkOut,
        currency,
        roomTypeCode,
        boardCode,
        adults,
        childrenAges: Array.isArray(childrenAges) ? childrenAges.map(Number) : [],
    };
}
