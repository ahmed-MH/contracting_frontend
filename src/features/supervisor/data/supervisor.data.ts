export const temporarySupervisorOverviewMetrics = [
    {
        label: 'Platform MRR',
        value: '$128.4k',
        delta: '+8.1% month over month',
        description: 'Recurring revenue across every active subscription tier.',
    },
    {
        label: 'Active Organizations',
        value: '48',
        delta: '+3 this quarter',
        description: 'Live tenant portfolios currently billed on the platform.',
    },
    {
        label: 'Suspension Queue',
        value: '02',
        delta: 'Requires review',
        description: 'Organizations flagged for delinquency or manual intervention.',
    },
    {
        label: 'Audit Throughput',
        value: '19.2k',
        delta: 'Events in 24h',
        description: 'Supervisor-visible platform and billing events captured today.',
    },
] as const;

export const temporaryPlatformPulse = [
    'No supervisor has visibility into contract, simulator, room, catalog, or affiliate records.',
    'Billing retries stabilized after the last webhook replay window.',
    'Tenant activation velocity remains ahead of plan for the quarter.',
] as const;

export const temporarySystemLogEvents = [
    {
        timestamp: '10:42 UTC',
        severity: 'Warning',
        title: 'Billing webhook retry queued',
        detail: 'Stripe invoice.updated delivery delayed for 2 organizations; replay scheduled.',
        scope: 'Billing',
    },
    {
        timestamp: '09:18 UTC',
        severity: 'Info',
        title: 'Tenant suspension run completed',
        detail: 'Two overdue organizations moved into restricted billing posture without exposing operational data.',
        scope: 'Tenants',
    },
    {
        timestamp: '08:03 UTC',
        severity: 'Critical',
        title: 'Audit sink storage threshold reached',
        detail: 'Retention policy trimmed low-priority debug events to keep compliance logs writable.',
        scope: 'Observability',
    },
] as const;

export const temporaryAuditTrail = [
    {
        actor: 'Supervisor Console',
        action: 'Updated Pro plan limits',
        target: 'Plan configuration',
        timestamp: '2026-04-07 10:10',
        severity: 'Config',
    },
    {
        actor: 'Billing daemon',
        action: 'Suspended overdue org',
        target: 'Blue Dune Collection',
        timestamp: '2026-04-07 09:18',
        severity: 'Enforcement',
    },
    {
        actor: 'Audit pipeline',
        action: 'Recovered storage pressure',
        target: 'Centralized logs',
        timestamp: '2026-04-07 08:07',
        severity: 'Reliability',
    },
] as const;
