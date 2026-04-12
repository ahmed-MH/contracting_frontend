export const supervisorOverviewMetrics = [
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

export const mrrSegments = [
    { name: 'Enterprise', share: '54%', mrr: '$69.3k', detail: 'Multi-entity portfolios with API and premium support.' },
    { name: 'Pro', share: '33%', mrr: '$42.4k', detail: 'Growth tenants operating several hotels under one org.' },
    { name: 'Free', share: '13%', mrr: '$16.7k uplift', detail: 'Conversion pool driven by onboarding and usage campaigns.' },
] as const;

export const platformPulse = [
    'No supervisor has visibility into contract, simulator, room, catalog, or affiliate records.',
    'Billing retries stabilized after the last webhook replay window.',
    'Tenant activation velocity remains ahead of plan for the quarter.',
] as const;

export const tenantOrganizations = [
    {
        name: 'Atlas Hospitality',
        plan: 'Enterprise',
        region: 'MENA',
        hotels: 18,
        users: 46,
        mrr: '$18,400',
        billingStatus: 'Paid',
        operationalStatus: 'Healthy',
    },
    {
        name: 'Blue Dune Collection',
        plan: 'Pro',
        region: 'Europe',
        hotels: 9,
        users: 21,
        mrr: '$6,900',
        billingStatus: 'Overdue',
        operationalStatus: 'Watchlist',
    },
    {
        name: 'Vista Resort Group',
        plan: 'Enterprise',
        region: 'Global',
        hotels: 24,
        users: 58,
        mrr: '$23,700',
        billingStatus: 'Paid',
        operationalStatus: 'Healthy',
    },
    {
        name: 'Sunline Leisure',
        plan: 'Pro',
        region: 'North Africa',
        hotels: 11,
        users: 27,
        mrr: '$8,250',
        billingStatus: 'Trial ending',
        operationalStatus: 'Review',
    },
] as const;

export const platformPlans = [
    {
        name: 'Free',
        price: '$0',
        cycle: '/month',
        summary: 'Entry plan for new organizations validating fit.',
        limits: ['1 hotel', '5 users', 'No API access', 'Community support'],
    },
    {
        name: 'Pro',
        price: '$499',
        cycle: '/month',
        summary: 'Growth tier with multi-property management and automation.',
        limits: ['10 hotels', '50 users', 'API access', 'Priority support'],
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        cycle: '',
        summary: 'Unlimited scale, governance controls, and premium onboarding.',
        limits: ['Unlimited hotels', 'Unlimited users', 'Dedicated API throughput', 'Success manager'],
    },
] as const;

export const planPrivilegeMatrix = [
    { capability: 'Hotel limit', free: '1', pro: '10', enterprise: 'Unlimited' },
    { capability: 'User seats', free: '5', pro: '50', enterprise: 'Unlimited' },
    { capability: 'API access', free: 'No', pro: 'Yes', enterprise: 'Yes + priority throughput' },
    { capability: 'System logs export', free: 'No', pro: 'CSV', enterprise: 'CSV + streaming hooks' },
    { capability: 'Billing governance', free: 'Basic', pro: 'Advanced', enterprise: 'Custom controls' },
] as const;

export const subscriptionWatchlist = [
    {
        organization: 'Blue Dune Collection',
        plan: 'Pro',
        mrr: '$6,900',
        renewalDate: '2026-04-14',
        status: 'Overdue',
    },
    {
        organization: 'Sunline Leisure',
        plan: 'Pro',
        mrr: '$8,250',
        renewalDate: '2026-04-19',
        status: 'Trial ending',
    },
    {
        organization: 'Atlas Hospitality',
        plan: 'Enterprise',
        mrr: '$18,400',
        renewalDate: '2026-05-01',
        status: 'Healthy',
    },
] as const;

export const systemLogEvents = [
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

export const auditTrail = [
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
