import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Calculator, Contact, FileText, Gift, Package, Percent, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

export default function ContractTabs() {
    const { t } = useTranslation('common');

    const tabs = [
        { to: 'general', label: t('pages.contractDetails.tabs.general', { defaultValue: 'General' }), icon: <FileText size={15} /> },
        { to: 'rates-grid', label: t('pages.contractDetails.tabs.ratesGrid', { defaultValue: 'Rates Grid' }), icon: <Calculator size={15} /> },
        { to: 'supplements', label: t('pages.contractDetails.tabs.supplements', { defaultValue: 'Supplements' }), icon: <Package size={15} /> },
        { to: 'reductions', label: t('pages.contractDetails.tabs.reductions', { defaultValue: 'Reductions' }), icon: <Percent size={15} /> },
        { to: 'monoparental', label: t('pages.contractDetails.tabs.monoparental', { defaultValue: 'Monoparental' }), icon: <Contact size={15} /> },
        { to: 'early-bookings', label: t('pages.contractDetails.tabs.earlyBookings', { defaultValue: 'Early Booking' }), icon: <CalendarDays size={15} /> },
        { to: 'spos', label: t('pages.contractDetails.tabs.spos', { defaultValue: 'Special Offers' }), icon: <Gift size={15} /> },
        { to: 'cancellation', label: t('pages.contractDetails.tabs.cancellation', { defaultValue: 'Cancellations' }), icon: <ShieldAlert size={15} /> },
    ];

    return (
        <div className="overflow-x-auto rounded-lg border border-brand-slate/15 bg-brand-light/70 p-2 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5">
            <nav className="flex min-w-max gap-2" aria-label={t('pages.contractDetails.tabs.label', { defaultValue: 'Contract sections' })}>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end
                        className={({ isActive }) =>
                            clsx(
                                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                                isActive
                                    ? 'bg-brand-mint text-brand-light shadow-sm'
                                    : 'text-brand-slate hover:bg-brand-light hover:text-brand-navy dark:text-brand-light/75 dark:hover:bg-brand-light/8 dark:hover:text-brand-light',
                            )
                        }
                    >
                        {tab.icon}
                        {tab.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
