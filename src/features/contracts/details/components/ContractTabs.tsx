import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Package, Baby, Contact, CalendarCheck, Gift, Calculator, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

export default function ContractTabs() {
    const { t } = useTranslation('common');

    const tabs = [
        { to: 'general', label: t('pages.contractDetails.tabs.general', { defaultValue: 'General' }), icon: <FileText size={16} /> },
        { to: 'rates-grid', label: t('pages.contractDetails.tabs.ratesGrid', { defaultValue: 'Rates Grid' }), icon: <Calculator size={16} /> },
        { to: 'supplements', label: t('pages.contractDetails.tabs.supplements', { defaultValue: 'Supplements' }), icon: <Package size={16} /> },
        { to: 'reductions', label: t('pages.contractDetails.tabs.reductions', { defaultValue: 'Reductions' }), icon: <Baby size={16} /> },
        { to: 'monoparental', label: t('pages.contractDetails.tabs.monoparental', { defaultValue: 'Monoparental' }), icon: <Contact size={16} /> },
        { to: 'early-bookings', label: t('pages.contractDetails.tabs.earlyBookings', { defaultValue: 'Early Booking' }), icon: <CalendarCheck size={16} /> },
        { to: 'spos', label: t('pages.contractDetails.tabs.spos', { defaultValue: 'Special Offers' }), icon: <Gift size={16} /> },
        { to: 'cancellation', label: t('pages.contractDetails.tabs.cancellation', { defaultValue: 'Cancellations' }), icon: <ShieldAlert size={16} /> },
    ];

    return (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/70 bg-white/65 p-2 shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-brand-navy/80">
            <nav className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end
                        className={({ isActive }) =>
                            clsx(
                                'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
                                isActive
                                    ? 'bg-brand-navy text-white shadow-md'
                                    : 'text-brand-slate hover:bg-white/70 hover:text-brand-navy dark:text-brand-light/75 dark:hover:bg-white/8 dark:hover:text-white',
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
