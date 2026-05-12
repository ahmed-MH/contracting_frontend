import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, Clock3, KeyRound, LockKeyhole, ServerCog, ShieldCheck, TimerReset, XCircle } from 'lucide-react';
import {
    IntegrationDetailTile,
    IntegrationEmptyState,
    IntegrationHero,
    IntegrationLogResultBadge,
    IntegrationMetricCard,
    IntegrationSectionCard,
    IntegrationStatusBadge,
} from '../components/IntegrationUi';
import { useIntegrationOverview } from '../hooks/useIntegrations';
import type { IntegrationUsageLog } from '../types/integrations.types';

const formatDateTime = (value: string | null | undefined, locale: string, fallback: string) =>
    value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : fallback;

export default function IntegrationOverviewPage() {
    const { t, i18n } = useTranslation('common');
    const { data: overview, isLoading } = useIntegrationOverview();
    const empty = t('pages.integrations.common.emptyValue');

    return (
        <div className="min-w-0 space-y-6 p-4 md:p-6">
            <IntegrationHero
                eyebrow={t('pages.integrations.overview.header.eyebrow')}
                title={t('pages.integrations.overview.header.title')}
                description={t('pages.integrations.overview.header.subtitle')}
                badge="reservations.quote"
            />

            {isLoading || !overview ? (
                <div className="flex h-40 items-center justify-center rounded-[1.75rem] border border-brand-light/70 bg-brand-light/65 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            ) : (
                <>
                    <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.requestsToday')} value={overview.totalsToday} icon={<Activity size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.successRate')} value={`${overview.successRateToday}%`} tone="success" icon={<ShieldCheck size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.averageDuration')} value={`${overview.averageDurationToday} ms`} tone="info" icon={<Clock3 size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.failedQuotes')} value={overview.failedToday} tone={overview.failedToday > 0 ? 'danger' : 'neutral'} icon={<XCircle size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.rateLimited')} value={overview.rateLimitedToday} tone={overview.rateLimitedToday > 0 ? 'warning' : 'neutral'} icon={<TimerReset size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.activeUsers')} value={overview.activeApiUsers} icon={<KeyRound size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.activeKeys')} value={overview.activeApiKeys} icon={<LockKeyhole size={18} />} />
                        <IntegrationMetricCard label={t('pages.integrations.overview.metrics.endpointStatus')} value={overview.endpointHealth[0]?.status ?? empty} tone={overview.endpointHealth[0]?.status === 'ACTIVE' ? 'success' : 'warning'} icon={<ServerCog size={18} />} />
                    </div>

                    <IntegrationSectionCard
                        eyebrow={t('pages.integrations.overview.alerts.eyebrow')}
                        title={t('pages.integrations.overview.alerts.title')}
                        description={t('pages.integrations.overview.alerts.description')}
                        tone={overview.alerts.some((alert) => alert.severity === 'CRITICAL') ? 'danger' : overview.alerts.length > 0 ? 'warning' : 'success'}
                    >
                        {overview.alerts.length === 0 ? (
                            <IntegrationEmptyState title={t('pages.integrations.overview.alerts.empty')} icon={<ShieldCheck size={18} />} />
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {overview.alerts.map((alert) => (
                                    <div key={`${alert.code}-${alert.message}`} className="rounded-[1.35rem] border border-brand-light/70 bg-brand-light/55 p-4 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <IntegrationStatusBadge
                                            tone={alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'WARNING' ? 'warning' : 'info'}
                                            label={alert.severity}
                                        />
                                        <p className="mt-3 text-sm font-medium text-brand-navy dark:text-brand-light">{alert.message}</p>
                                        <p className="mt-2 font-mono text-[11px] text-brand-slate dark:text-brand-light/55">{alert.code}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </IntegrationSectionCard>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <IntegrationSectionCard
                            eyebrow={t('pages.integrations.overview.health.eyebrow')}
                            title={t('pages.integrations.overview.health.title')}
                            description={t('pages.integrations.overview.health.description')}
                            tone={overview.endpointHealth[0]?.status === 'ACTIVE' ? 'success' : 'warning'}
                        >
                            <div className="space-y-3">
                                {overview.endpointHealth.map((health) => (
                                    <div key={health.endpointCode} className="space-y-4 rounded-[1.5rem] border border-brand-light/70 bg-brand-light/50 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-mono text-sm font-semibold text-brand-navy dark:text-brand-light">{health.endpointCode}</p>
                                                <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/65">{health.currentRateLimitPerMinute} / min</p>
                                            </div>
                                            <IntegrationStatusBadge tone={health.status === 'ACTIVE' ? 'success' : 'warning'} label={health.status} />
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Detail label={t('pages.integrations.overview.health.successRate')} value={`${health.successRateToday}%`} />
                                            <Detail label={t('pages.integrations.overview.health.averageDuration')} value={`${health.averageDurationToday} ms`} />
                                            <Detail label={t('pages.integrations.overview.health.rateLimitHits')} value={String(health.rateLimitHitsToday)} />
                                            <Detail label={t('pages.integrations.overview.health.lastSuccess')} value={formatDateTime(health.lastSuccessfulCall, i18n.language, empty)} />
                                            <Detail label={t('pages.integrations.overview.health.lastFailure')} value={formatDateTime(health.lastFailedCall, i18n.language, empty)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </IntegrationSectionCard>

                        <IntegrationSectionCard
                            eyebrow={t('pages.integrations.overview.errors.eyebrow')}
                            title={t('pages.integrations.overview.errors.title')}
                            description={t('pages.integrations.overview.errors.description')}
                            tone={overview.topErrorCodes.length > 0 ? 'danger' : 'success'}
                        >
                            {overview.topErrorCodes.length === 0 ? (
                                <IntegrationEmptyState title={t('pages.integrations.overview.errors.empty')} icon={<ShieldCheck size={18} />} />
                            ) : (
                                <div className="space-y-2">
                                    {overview.topErrorCodes.map((error) => (
                                        <div key={error.errorCode} className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-brand-light/70 bg-brand-light/55 px-4 py-3 text-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                            <span className="min-w-0 break-all font-mono text-xs text-brand-navy dark:text-brand-light">{error.errorCode}</span>
                                            <IntegrationStatusBadge tone="danger" label={error.count} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </IntegrationSectionCard>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <LogSummary title={t('pages.integrations.overview.lastSuccess')} log={overview.lastSuccessfulQuote} empty={empty} locale={i18n.language} />
                        <LogSummary title={t('pages.integrations.overview.lastFailure')} log={overview.lastFailedQuote} empty={empty} locale={i18n.language} />
                    </div>

                    <IntegrationSectionCard
                        eyebrow={t('pages.integrations.overview.recent.eyebrow')}
                        title={t('pages.integrations.overview.recent.title')}
                        description={t('pages.integrations.overview.recent.description')}
                        actions={(
                            <Link
                                to="/admin/integrations/logs"
                                aria-label={t('pages.integrations.nav.logs')}
                                title={t('pages.integrations.nav.logs')}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                            >
                                <ArrowRight size={18} />
                            </Link>
                        )}
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="text-brand-slate">
                                    <tr>
                                        <th className="whitespace-nowrap px-4 py-2.5">{t('pages.integrations.logs.table.date')}</th>
                                        <th className="whitespace-nowrap px-4 py-2.5">{t('pages.integrations.logs.table.endpoint')}</th>
                                        <th className="whitespace-nowrap px-4 py-2.5">{t('pages.integrations.logs.table.result')}</th>
                                        <th className="whitespace-nowrap px-4 py-2.5">{t('pages.integrations.logs.table.duration')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overview.recentUsageLogs.map((log) => (
                                        <tr key={log.id} className="border-t border-brand-light/70 transition hover:bg-brand-light/45 dark:border-brand-light/10 dark:hover:bg-brand-light/5">
                                            <td className="px-4 py-2.5">{formatDateTime(log.createdAt, i18n.language, empty)}</td>
                                            <td className="px-4 py-2.5">
                                                <p className="font-mono text-xs font-semibold text-brand-navy dark:text-brand-light">{log.endpointCode}</p>
                                            </td>
                                            <td className="px-4 py-2.5"><IntegrationLogResultBadge success={log.success} statusCode={log.statusCode} errorCode={log.errorCode} /></td>
                                            <td className="px-4 py-2.5">{log.durationMs} ms</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </IntegrationSectionCard>
                </>
            )}
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/75">{label}</p>
            <p className="mt-1 break-words text-brand-navy dark:text-brand-light">{value}</p>
        </div>
    );
}

function LogSummary({ title, log, empty, locale }: { title: string; log: IntegrationUsageLog | null; empty: string; locale: string }) {
    const { t } = useTranslation('common');

    return (
        <IntegrationSectionCard eyebrow={t('pages.integrations.overview.quote.eyebrow')} title={title} tone={log?.success ? 'success' : log ? 'danger' : 'neutral'}>
            {log ? (
                <div className="grid gap-3 md:grid-cols-2">
                    <IntegrationDetailTile label={t('pages.integrations.overview.quote.requestId')} value={log.requestId ?? empty} mono />
                    <IntegrationDetailTile label={t('pages.integrations.overview.quote.http')} value={<IntegrationLogResultBadge success={log.success} statusCode={log.statusCode} errorCode={log.errorCode} />} />
                    <IntegrationDetailTile label={t('pages.integrations.overview.quote.created')} value={formatDateTime(log.createdAt, locale, empty)} />
                    <IntegrationDetailTile label={t('pages.integrations.overview.quote.error')} value={log.errorCode ?? empty} mono tone={log.errorCode ? 'danger' : 'neutral'} />
                </div>
            ) : (
                <IntegrationEmptyState title={empty} icon={<AlertTriangle size={18} />} />
            )}
        </IntegrationSectionCard>
    );
}
