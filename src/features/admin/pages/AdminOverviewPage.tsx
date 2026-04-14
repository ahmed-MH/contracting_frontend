import { Briefcase, Building2, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminPageHeader from '../components/AdminPageHeader';
import AdminSectionCard from '../components/AdminSectionCard';
import { useUsers } from '../hooks/useUsers';
import { useHotels } from '../../hotel/hooks/useHotels';

export default function AdminOverviewPage() {
    const { t } = useTranslation('common');
    const { data: users = [] } = useUsers();
    const { data: hotels = [] } = useHotels();

    const activeUsers = users.filter((user) => user.isActive).length;
    const pendingUsers = users.length - activeUsers;
    const admins = users.filter((user) => user.role === 'ADMIN').length;
    const commercials = users.filter((user) => user.role === 'COMMERCIAL').length;
    const billingHighlights = [
        t('pages.adminOverview.billing.highlights.seatAllocation', { defaultValue: 'Seat allocation matches the current team roster.' }),
        t('pages.adminOverview.billing.highlights.hotelLaunches', { defaultValue: 'Two new hotel launches are ready for onboarding.' }),
        t('pages.adminOverview.billing.highlights.noDisputes', { defaultValue: 'No unresolved billing disputes in the current cycle.' }),
    ];
    const immediatePriorities = [
        t('pages.adminOverview.priorities.items.validateInvites', { defaultValue: 'Validate pending invites before the next onboarding batch.' }),
        t('pages.adminOverview.priorities.items.reviewOwnership', { defaultValue: 'Review hotel ownership before opening a new contract cycle.' }),
        t('pages.adminOverview.priorities.items.confirmContacts', { defaultValue: 'Confirm billing contacts for finance and operations.' }),
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <AdminPageHeader
                eyebrow={t('pages.adminOverview.header.eyebrow', { defaultValue: 'Organization Snapshot' })}
                title={t('pages.adminOverview.header.title', { defaultValue: 'Keep the business layer calm and ready.' })}
                description={t('pages.adminOverview.header.subtitle', { defaultValue: 'This cockpit is tuned for the people operating the organization: seats, billing hygiene, permissions, and the health of the hotel portfolio.' })}
                badge={t('pages.adminOverview.team.totalUsers', { defaultValue: '{{count}} total users', count: users.length })}
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: t('pages.adminOverview.metrics.activeUsers', { defaultValue: 'Active Users' }), value: activeUsers, icon: Users },
                        { label: t('pages.adminOverview.metrics.pendingInvites', { defaultValue: 'Pending Invites' }), value: pendingUsers, icon: ShieldCheck },
                        { label: t('pages.adminOverview.metrics.liveHotels', { defaultValue: 'Live Hotels' }), value: hotels.length, icon: Building2 },
                        { label: t('pages.adminOverview.metrics.adminSeats', { defaultValue: 'Admin Seats' }), value: admins, icon: Briefcase },
                    ].map((metric) => {
                        const Icon = metric.icon;

                        return (
                            <div key={metric.label} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-4 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-brand-slate">{metric.label}</p>
                                    <div className="rounded-2xl bg-brand-mint/10 p-2 text-brand-mint">
                                        <Icon size={16} />
                                    </div>
                                </div>
                                <p className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                    {metric.value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </AdminPageHeader>

            <section className="grid gap-4 xl:grid-cols-[1.4fr,0.9fr]">
                <AdminSectionCard
                    eyebrow={t('pages.adminOverview.billing.eyebrow', { defaultValue: 'Billing Control' })}
                    title={t('pages.adminOverview.billing.title', { defaultValue: 'Renewal posture' })}
                    description={t('pages.adminOverview.billing.invoiceHint', { defaultValue: 'All current licenses are within plan limits.' })}
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-brand-mint/12 p-3 text-brand-mint">
                            <CreditCard size={18} />
                        </div>
                        <p className="text-sm text-brand-slate dark:text-brand-light/75">
                            {t('pages.adminOverview.billing.nextInvoice', { defaultValue: 'Next invoice window' })}
                        </p>
                    </div>

                    <div className="mt-6 rounded-2xl bg-brand-navy px-5 py-4 text-brand-light">
                        <p className="text-sm text-brand-slate">{t('pages.adminOverview.billing.nextInvoice', { defaultValue: 'Next invoice window' })}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">{t('auto.features.admin.pages.adminoverviewpage.fb3c2467', { defaultValue: "14 Apr" })}</p>
                    </div>

                    <div className="mt-5 space-y-3">
                        {billingHighlights.map((item) => (
                            <div key={item} className="rounded-2xl border border-brand-mint/15 bg-brand-mint/8 px-4 py-3 text-sm text-brand-navy dark:text-brand-light">
                                {item}
                            </div>
                        ))}
                    </div>
                </AdminSectionCard>

                <AdminSectionCard
                    eyebrow={t('pages.adminOverview.team.eyebrow', { defaultValue: 'Team Mix' })}
                    title={t('pages.adminOverview.team.title', { defaultValue: 'Current operating model' })}
                    actions={(
                        <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                            {t('pages.adminOverview.team.totalUsers', { defaultValue: '{{count}} total users', count: users.length })}
                        </span>
                    )}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <p className="text-sm font-medium text-brand-slate">{t('pages.adminOverview.team.admins.title', { defaultValue: 'Admins' })}</p>
                            <p className="mt-3 text-4xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{admins}</p>
                            <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                                {t('pages.adminOverview.team.admins.subtitle', { defaultValue: 'Governance, billing, and platform operations.' })}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <p className="text-sm font-medium text-brand-slate">{t('pages.adminOverview.team.commercials.title', { defaultValue: 'Commercials' })}</p>
                            <p className="mt-3 text-4xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{commercials}</p>
                            <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                                {t('pages.adminOverview.team.commercials.subtitle', { defaultValue: 'Production users handling product, partners, and contracts.' })}
                            </p>
                        </div>
                    </div>
                </AdminSectionCard>
            </section>

            <AdminSectionCard
                eyebrow={t('pages.adminOverview.priorities.title', { defaultValue: 'Immediate Priorities' })}
                title={t('pages.adminOverview.priorities.subtitle', { defaultValue: 'What deserves attention next' })}
                description={t('pages.adminOverview.priorities.description', { defaultValue: 'These checks keep permissions, billing, and hotel ownership aligned before the next commercial cycle starts.' })}
            >
                <div className="grid gap-3 lg:grid-cols-3">
                    {immediatePriorities.map((item) => (
                        <div key={item} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-4 text-sm text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                            {item}
                        </div>
                    ))}
                </div>
            </AdminSectionCard>
        </div>
    );
}
