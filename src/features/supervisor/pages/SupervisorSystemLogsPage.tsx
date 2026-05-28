import { AlertTriangle, ClipboardList, Filter, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { plannedSupervisorMonitoringSignals } from '../data/supervisor.data';
import {
    useSupervisorSystemLogs,
    type ListSupervisorSystemLogsParams,
    type SupervisorAuditLogCategory,
    type SupervisorAuditLogSeverity,
    type SupervisorSystemLog,
} from '../hooks/useSupervisor';

const categories: SupervisorAuditLogCategory[] = [
    'AUTH',
    'TENANT',
    'PLAN',
    'SUBSCRIPTION',
    'BILLING',
    'WEBHOOK',
    'INVITE',
    'ENTITLEMENT',
    'SYSTEM',
];

const severities: SupervisorAuditLogSeverity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const pageSize = 25;

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function badgeClass(kind: SupervisorAuditLogSeverity | SupervisorAuditLogCategory): string {
    if (kind === 'CRITICAL') return 'border-red-600 bg-red-600 text-white';
    if (kind === 'ERROR') return 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-200';
    if (kind === 'WARNING') return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200';
    if (kind === 'INFO') return 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75';
    if (kind === 'WEBHOOK' || kind === 'BILLING' || kind === 'SUBSCRIPTION') return 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint';
    if (kind === 'ENTITLEMENT') return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200';
    return 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75';
}

function actorLabel(log: SupervisorSystemLog): string {
    if (log.actorEmail) return log.actorEmail;
    if (log.actorRole) return log.actorRole;
    return 'System';
}

function targetLabel(log: SupervisorSystemLog): string {
    if (!log.targetType && !log.targetId) return 'None';
    return [log.targetType, log.targetId].filter(Boolean).join(' #');
}

function MetadataDetails({ metadata }: { metadata: Record<string, unknown> | null }) {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
        <details className="mt-3 rounded-xl border border-brand-slate/15 bg-white/65 px-3 py-2 text-xs text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70">
            <summary className="cursor-pointer font-semibold text-brand-navy dark:text-brand-light">Details</summary>
            <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5">
                {JSON.stringify(metadata, null, 2)}
            </pre>
        </details>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-brand-slate/25 bg-white/55 p-8 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            {label}
        </div>
    );
}

function formatPaginationSummary(first: number, last: number, total: number): string {
    if (total === 0) return 'No logs found';
    return `Showing ${first}-${last} of ${total}`;
}

function FilterField({
    label,
    meaning,
    children,
    className,
}: {
    label: string;
    meaning: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={`min-w-0 ${className ?? ''}`}>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate/90 dark:text-brand-light/60">
                {label}
            </span>
            <span className="mt-1 block truncate text-xs text-brand-slate/75 dark:text-brand-light/50">
                {meaning}
            </span>
            <div className="mt-2">{children}</div>
        </label>
    );
}

export default function SupervisorSystemLogsPage() {
    const { t } = useTranslation('common');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<SupervisorAuditLogCategory | ''>('');
    const [severity, setSeverity] = useState<SupervisorAuditLogSeverity | ''>('');
    const [tenantId, setTenantId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const queryParams = useMemo<ListSupervisorSystemLogsParams>(() => ({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        category: category || undefined,
        severity: severity || undefined,
        tenantId: tenantId.trim() && Number.isInteger(Number(tenantId.trim())) ? Number(tenantId.trim()) : undefined,
        from: from || undefined,
        to: to || undefined,
    }), [category, from, page, search, severity, tenantId, to]);

    const logsQuery = useSupervisorSystemLogs(queryParams);
    const logs = logsQuery.data?.items ?? [];
    const total = logsQuery.data?.total ?? 0;
    const responseLimit = logsQuery.data?.limit ?? pageSize;
    const currentPage = logsQuery.data?.page ?? page;
    const totalPages = Math.max(1, Math.ceil(total / responseLimit));
    const firstVisibleLog = total === 0 ? 0 : ((currentPage - 1) * responseLimit) + 1;
    const lastVisibleLog = total === 0 ? 0 : Math.min(currentPage * responseLimit, total);
    const paginationDisabled = logsQuery.isFetching;
    const warningCount = logs.filter((log) => log.severity === 'WARNING').length;
    const errorCount = logs.filter((log) => log.severity === 'ERROR' || log.severity === 'CRITICAL').length;

    const updateFilter = (setter: (value: string) => void, value: string) => {
        setter(value);
        setPage(1);
    };

    useEffect(() => {
        if (!logsQuery.data || logsQuery.isFetching) return;
        if (total === 0 && page !== 1) {
            setPage(1);
            return;
        }
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [logsQuery.data, logsQuery.isFetching, page, total, totalPages]);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.logs.header.eyebrow', { defaultValue: 'System Logs' })}
                title={t('pages.supervisor.logs.header.title', { defaultValue: 'Platform audit trail for supervisors.' })}
                description={t('pages.supervisor.logs.header.description', {
                    defaultValue: 'Inspect real platform events across tenants, billing, webhooks, invitations, and entitlement enforcement without entering tenant workspaces.',
                })}
                badge={t('pages.supervisor.logs.header.badge', { defaultValue: 'Backend-backed audit logs' })}
                badgeTone="slate"
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label="Recorded events"
                    value={logsQuery.isLoading ? '...' : String(total)}
                    delta="System audit table"
                    description="Total rows matching the current filters."
                    icon={ClipboardList}
                    tone="mint"
                />
                <SupervisorMetricCard
                    label="Visible page"
                    value={`${currentPage}/${totalPages}`}
                    delta={`${logs.length} rows loaded`}
                    description="Supervisor endpoint returns paginated audit events."
                    icon={Filter}
                    tone="navy"
                />
                <SupervisorMetricCard
                    label="Warnings"
                    value={logsQuery.isLoading ? '...' : String(warningCount)}
                    delta="Current page"
                    description="Plan, billing, entitlement, or webhook events needing attention."
                    icon={AlertTriangle}
                    tone="amber"
                />
                <SupervisorMetricCard
                    label="Errors"
                    value={logsQuery.isLoading ? '...' : String(errorCount)}
                    delta="Current page"
                    description="Failed webhooks, onboarding failures, or critical audit events."
                    icon={ShieldCheck}
                    tone="navy"
                />
            </section>

            <SupervisorSectionCard
                eyebrow="Audit stream"
                title="System activity"
                description="Rows come from the backend audit log. Sensitive tokens, passwords, signatures, and raw Stripe payloads are redacted before storage and display."
                actions={(
                    <button
                        type="button"
                        onClick={() => logsQuery.refetch()}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-brand-slate/15 bg-white/75 px-4 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                )}
            >
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
                    <FilterField label="Search" meaning="Message, actor, tenant, event" className="lg:col-span-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                            <input
                                value={search}
                                onChange={(event) => updateFilter(setSearch, event.target.value)}
                                placeholder="Search logs..."
                                className="h-12 w-full rounded-2xl border border-brand-slate/25 bg-brand-light pl-11 pr-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light"
                            />
                        </div>
                    </FilterField>
                    <FilterField label="Category" meaning="Event family">
                        <select value={category} onChange={(event) => updateFilter((value) => setCategory(value as SupervisorAuditLogCategory | ''), event.target.value)} className="h-12 w-full rounded-2xl border border-brand-slate/25 bg-brand-light px-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light">
                            <option value="">All categories</option>
                            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </FilterField>
                    <FilterField label="Severity" meaning="Risk level">
                        <select value={severity} onChange={(event) => updateFilter((value) => setSeverity(value as SupervisorAuditLogSeverity | ''), event.target.value)} className="h-12 w-full rounded-2xl border border-brand-slate/25 bg-brand-light px-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light">
                            <option value="">All severities</option>
                            {severities.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </FilterField>
                    <FilterField label="Tenant" meaning="Tenant ID">
                        <input
                            type="number"
                            min="1"
                            value={tenantId}
                            onChange={(event) => updateFilter(setTenantId, event.target.value)}
                            placeholder="Any tenant"
                            className="h-12 w-full rounded-2xl border border-brand-slate/25 bg-brand-light px-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light"
                        />
                    </FilterField>
                    <FilterField label="From" meaning="Start date">
                        <input type="date" value={from} onChange={(event) => updateFilter(setFrom, event.target.value)} className="h-12 w-full rounded-2xl border border-brand-slate/25 bg-brand-light px-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light" />
                    </FilterField>
                    <FilterField label="To" meaning="End date">
                        <input type="date" value={to} onChange={(event) => updateFilter(setTo, event.target.value)} className="h-12 w-full rounded-2xl border border-brand-slate/25 bg-brand-light px-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light" />
                    </FilterField>
                </div>

                {logsQuery.isLoading ? (
                    <div className="mt-5 rounded-2xl border border-brand-slate/15 bg-white/65 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                        Loading system logs...
                    </div>
                ) : logsQuery.isError ? (
                    <EmptyState label="System logs could not be loaded." />
                ) : logs.length === 0 ? (
                    <EmptyState label={t('pages.supervisor.logs.pagination.noLogs', { defaultValue: 'No logs found' })} />
                ) : (
                    <div className="mt-5 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-brand-navy/5 text-brand-slate dark:bg-brand-light/5 dark:text-brand-light/65">
                                <tr>
                                    {['Time', 'Severity', 'Category', 'Message', 'Actor', 'Tenant', 'Target'].map((label) => (
                                        <th key={label} className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-slate/12 dark:divide-brand-light/10">
                                {logs.map((log) => (
                                    <tr key={log.id} className="bg-white/45 transition hover:bg-brand-mint/5 dark:bg-transparent dark:hover:bg-brand-light/[0.035]">
                                        <td className="whitespace-nowrap px-5 py-4 text-brand-slate dark:text-brand-light/75">{formatDateTime(log.createdAt)}</td>
                                        <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(log.severity)}`}>{log.severity}</span></td>
                                        <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(log.category)}`}>{log.category}</span></td>
                                        <td className="min-w-[320px] px-5 py-4">
                                            <p className="break-words font-semibold text-brand-navy dark:text-brand-light">{log.message}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-brand-slate">{log.eventType}</p>
                                            <MetadataDetails metadata={log.metadata} />
                                        </td>
                                        <td className="px-5 py-4 text-brand-slate dark:text-brand-light/75">{actorLabel(log)}</td>
                                        <td className="px-5 py-4 text-brand-slate dark:text-brand-light/75">{log.tenantName ?? (log.tenantId ? `Tenant #${log.tenantId}` : 'Global')}</td>
                                        <td className="px-5 py-4 text-brand-slate dark:text-brand-light/75">{targetLabel(log)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {total === 0
                                ? t('pages.supervisor.logs.pagination.noLogs', { defaultValue: 'No logs found' })
                                : t('pages.supervisor.logs.pagination.range', {
                                    defaultValue: formatPaginationSummary(firstVisibleLog, lastVisibleLog, total),
                                    first: firstVisibleLog,
                                    last: lastVisibleLog,
                                    total,
                                })}
                        </p>
                        <p className="text-xs text-brand-slate dark:text-brand-light/60">
                            {t('pages.supervisor.logs.pagination.page', {
                                defaultValue: 'Page {{page}} of {{totalPages}}',
                                page: currentPage,
                                totalPages,
                            })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" disabled={paginationDisabled || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-10 rounded-2xl border border-brand-slate/15 bg-white/50 px-4 text-sm font-semibold text-brand-navy transition hover:border-brand-mint/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-light/10 dark:bg-transparent dark:text-brand-light">
                            {t('pages.supervisor.logs.pagination.previous', { defaultValue: 'Previous' })}
                        </button>
                        <button type="button" disabled={paginationDisabled || page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="h-10 rounded-2xl border border-brand-slate/15 bg-white/50 px-4 text-sm font-semibold text-brand-navy transition hover:border-brand-mint/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-light/10 dark:bg-transparent dark:text-brand-light">
                            {t('pages.supervisor.logs.pagination.next', { defaultValue: 'Next' })}
                        </button>
                    </div>
                </div>
            </SupervisorSectionCard>

            <SupervisorSectionCard
                eyebrow="Coverage roadmap"
                title="Logged supervisor signals"
                description="This panel describes intended coverage only; activity rows above are the source of truth."
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {plannedSupervisorMonitoringSignals.map((signal, index) => (
                        <div key={signal} className="flex items-center gap-3 rounded-2xl border border-brand-slate/15 bg-white/70 px-4 py-3 text-sm text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-mint/10 text-sm font-semibold text-brand-mint">
                                {index + 1}
                            </span>
                            {signal}
                        </div>
                    ))}
                </div>
            </SupervisorSectionCard>
        </div>
    );
}
