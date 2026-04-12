import { AlertTriangle, DatabaseZap, ShieldCheck, TimerReset } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import { auditTrail, systemLogEvents } from '../data/supervisor.data';

export default function SupervisorSystemLogsPage() {
    const { t } = useTranslation('common');

    const auditColumns: SupervisorTableColumn<(typeof auditTrail)[number]>[] = [
        {
            key: 'actor',
            label: t('pages.supervisor.logs.cards.auditTrail.columns.actor', { defaultValue: 'Actor' }),
            render: (row) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-white">
                        {t(`pages.supervisor.logs.cards.auditTrail.rows.${auditTrail.indexOf(row)}.actor`, { defaultValue: row.actor })}
                    </p>
                    <p className="mt-1 text-xs text-brand-slate">
                        {t(`pages.supervisor.logs.cards.auditTrail.rows.${auditTrail.indexOf(row)}.severity`, { defaultValue: row.severity })}
                    </p>
                </div>
            ),
        },
        {
            key: 'action',
            label: t('pages.supervisor.logs.cards.auditTrail.columns.action', { defaultValue: 'Action' }),
            render: (row) => (
                <span className="text-brand-navy dark:text-white">
                    {t(`pages.supervisor.logs.cards.auditTrail.rows.${auditTrail.indexOf(row)}.action`, { defaultValue: row.action })}
                </span>
            ),
        },
        {
            key: 'target',
            label: t('pages.supervisor.logs.cards.auditTrail.columns.target', { defaultValue: 'Target' }),
            render: (row) => (
                <span className="text-brand-slate dark:text-brand-light/75">
                    {t(`pages.supervisor.logs.cards.auditTrail.rows.${auditTrail.indexOf(row)}.target`, { defaultValue: row.target })}
                </span>
            ),
        },
        {
            key: 'timestamp',
            label: t('pages.supervisor.logs.cards.auditTrail.columns.timestamp', { defaultValue: 'Timestamp' }),
            render: (row) => <span className="text-brand-slate dark:text-brand-light/75">{row.timestamp}</span>,
        },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.logs.header.eyebrow', { defaultValue: 'System Logs' })}
                title={t('pages.supervisor.logs.header.title', { defaultValue: 'Platform audit and reliability stream for supervisors.' })}
                description={t('pages.supervisor.logs.header.description', {
                    defaultValue: 'A supervisor can inspect platform-level events, billing enforcement, and audit retention signals here without entering any tenant operational workspace.',
                })}
                badge={t('pages.supervisor.logs.header.badge', { defaultValue: 'Audit-safe visibility' })}
                badgeTone="slate"
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label={t('pages.supervisor.logs.metrics.criticalAlerts.label', { defaultValue: 'Critical Alerts' })}
                    value="1"
                    delta={t('pages.supervisor.logs.metrics.criticalAlerts.delta', { defaultValue: 'In last 24 hours' })}
                    description={t('pages.supervisor.logs.metrics.criticalAlerts.description', { defaultValue: 'Open incident-class events needing platform attention.' })}
                    icon={AlertTriangle}
                    tone="amber"
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.logs.metrics.auditRetention.label', { defaultValue: 'Audit Retention' })}
                    value="97%"
                    delta={t('pages.supervisor.logs.metrics.auditRetention.delta', { defaultValue: 'Policy coverage' })}
                    description={t('pages.supervisor.logs.metrics.auditRetention.description', { defaultValue: 'Share of supervisor-visible events retained within policy objectives.' })}
                    icon={ShieldCheck}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.logs.metrics.replayJobs.label', { defaultValue: 'Replay Jobs' })}
                    value="5"
                    delta={t('pages.supervisor.logs.metrics.replayJobs.delta', { defaultValue: 'Queued' })}
                    description={t('pages.supervisor.logs.metrics.replayJobs.description', { defaultValue: 'Webhook and event replay tasks waiting in the recovery queue.' })}
                    icon={TimerReset}
                    tone="navy"
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.logs.metrics.storageHeadroom.label', { defaultValue: 'Storage Headroom' })}
                    value="68%"
                    delta={t('pages.supervisor.logs.metrics.storageHeadroom.delta', { defaultValue: 'Available' })}
                    description={t('pages.supervisor.logs.metrics.storageHeadroom.description', { defaultValue: 'Remaining capacity for centralized logs and audit sinks.' })}
                    icon={DatabaseZap}
                />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.logs.cards.liveEventStream.eyebrow', { defaultValue: 'Live Event Stream' })}
                    title={t('pages.supervisor.logs.cards.liveEventStream.title', { defaultValue: 'Recent platform events' })}
                    description={t('pages.supervisor.logs.cards.liveEventStream.description', { defaultValue: 'Supervisor-visible system activity, organized by severity and control surface.' })}
                >
                    <div className="space-y-3">
                        {systemLogEvents.map((event, index) => (
                            <div key={`${event.timestamp}-${event.title}`} className="rounded-2xl border border-white/70 bg-white/72 p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                                                {t(`pages.supervisor.logs.cards.liveEventStream.events.${index}.scope`, { defaultValue: event.scope })}
                                            </span>
                                            <span className={`premium-pill ${
                                                event.severity === 'Critical'
                                                    ? 'border-brand-slate/30 bg-brand-slate/10 text-brand-slate'
                                                    : event.severity === 'Warning'
                                                        ? 'border-brand-mint/30 bg-brand-mint/10 text-brand-mint'
                                                        : 'border-brand-slate/20 bg-brand-light text-brand-slate dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75'
                                            }`}>
                                                {t(`pages.supervisor.logs.cards.liveEventStream.events.${index}.severity`, { defaultValue: event.severity })}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-brand-navy dark:text-white">
                                            {t(`pages.supervisor.logs.cards.liveEventStream.events.${index}.title`, { defaultValue: event.title })}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                                            {t(`pages.supervisor.logs.cards.liveEventStream.events.${index}.detail`, { defaultValue: event.detail })}
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium text-brand-slate dark:text-brand-light/75">{event.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SupervisorSectionCard>

                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.logs.cards.auditTrail.eyebrow', { defaultValue: 'Audit Trail' })}
                    title={t('pages.supervisor.logs.cards.auditTrail.title', { defaultValue: 'Configuration and enforcement history' })}
                    description={t('pages.supervisor.logs.cards.auditTrail.description', { defaultValue: 'Compact timeline of supervisor-safe administrative actions.' })}
                >
                    <SupervisorDataTable
                        columns={auditColumns}
                        rows={[...auditTrail]}
                        rowKey={(row) => `${row.actor}-${row.timestamp}`}
                    />
                </SupervisorSectionCard>
            </section>
        </div>
    );
}
