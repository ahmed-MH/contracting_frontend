import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Hotel,
    BedDouble,
    UtensilsCrossed,
    Package,
    Baby,
    Users,
    FileText,
    ChevronRight,
    Shield,
    Contact,
    CalendarCheck,
    PanelLeftClose,
    PanelLeftOpen,
    Gift,
    ShieldAlert,
    Calculator,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '../ui/Logo';

interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    userRole?: string;
}

export default function Sidebar({ collapsed, onToggle, userRole }: SidebarProps) {
    const { t } = useTranslation('common');

    const menuSections: { title: string; items: NavItem[] }[] = [
        {
            title: t('navigation.commercial.sections.product', { defaultValue: 'My Product' }),
            items: [
                { label: t('navigation.commercial.product.hotelInformation', { defaultValue: 'Hotel Information' }), to: '/hotel-setup/hotel-information', icon: <Hotel size={18} /> },
                { label: t('navigation.commercial.product.rooms', { defaultValue: 'Rooms' }), to: '/product/rooms', icon: <BedDouble size={18} /> },
                { label: t('navigation.commercial.product.arrangements', { defaultValue: 'Arrangements' }), to: '/product/arrangements', icon: <UtensilsCrossed size={18} /> },
                { label: t('navigation.commercial.product.supplements', { defaultValue: 'Supplements' }), to: '/product/supplements', icon: <Package size={18} /> },
                { label: t('navigation.commercial.product.spos', { defaultValue: 'Special Offers' }), to: '/product/spos', icon: <Gift size={18} /> },
                { label: t('navigation.commercial.product.reductions', { defaultValue: 'Reductions' }), to: '/product/reductions', icon: <Baby size={18} /> },
                { label: t('navigation.commercial.product.monoparental', { defaultValue: 'Monoparental' }), to: '/product/monoparental', icon: <Contact size={18} /> },
                { label: t('navigation.commercial.product.earlyBooking', { defaultValue: 'Early Booking' }), to: '/product/early-bookings', icon: <CalendarCheck size={18} /> },
                { label: t('navigation.commercial.product.cancellations', { defaultValue: 'Cancellations' }), to: '/product/cancellations', icon: <ShieldAlert size={18} /> },
            ],
        },
        {
            title: t('navigation.commercial.sections.partners', { defaultValue: 'My Partners' }),
            items: [
                { label: t('navigation.commercial.primary.partners.label', { defaultValue: 'Affiliates / TO' }), to: '/partners/affiliates', icon: <Users size={18} /> },
            ],
        },
        {
            title: t('navigation.commercial.sections.contracts', { defaultValue: 'Contract Management' }),
            items: [
                { label: t('navigation.commercial.primary.contracts.label', { defaultValue: 'Contracts List' }), to: '/contracts', icon: <FileText size={18} /> },
                { label: t('navigation.commercial.primary.simulator.label', { defaultValue: 'Price Simulator' }), to: '/simulator', icon: <Calculator size={18} /> },
            ],
        },
    ];

    return (
        <aside
            className={clsx(
                'flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out',
                'bg-brand-light border-r border-brand-slate/15',
                'dark:bg-brand-navy dark:border-brand-slate/20',
                collapsed ? 'w-[68px]' : 'w-64',
            )}
        >
            <div
                className={clsx(
                    'flex items-center border-b border-brand-slate/15 dark:border-brand-slate/20 transition-all duration-300 shrink-0',
                    collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4',
                )}
            >
                {!collapsed && (
                    <div className="flex-1 min-w-0">
                        <Logo />
                    </div>
                )}

                <button
                    onClick={onToggle}
                    title={collapsed
                        ? t('components.sidebar.expandMenu', { defaultValue: 'Expand menu' })
                        : t('components.sidebar.collapseMenu', { defaultValue: 'Collapse menu' })}
                    className={clsx(
                        'p-1.5 rounded-xl transition-colors cursor-pointer shrink-0',
                        'text-brand-slate hover:text-brand-navy hover:bg-brand-slate/10',
                        'dark:text-brand-slate dark:hover:text-brand-light dark:hover:bg-brand-slate/20',
                        collapsed && 'mx-auto',
                    )}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <nav
                className={clsx(
                    'flex-1 overflow-y-auto py-4 space-y-6 transition-all duration-300',
                    collapsed ? 'px-2' : 'px-3',
                )}
            >
                {menuSections.map((section) => (
                    <div key={section.title}>
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-slate/60 dark:text-brand-slate/50">
                                {section.title}
                            </p>
                        )}

                        <ul className="space-y-0.5">
                            {section.items.map((item) => (
                                <li key={item.to}>
                                    <NavLink
                                        to={item.to}
                                        title={collapsed ? item.label : undefined}
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                                                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                                                isActive
                                                    ? 'bg-brand-mint/10 text-brand-mint dark:bg-brand-slate/30 dark:text-brand-mint'
                                                    : 'text-brand-slate hover:bg-brand-slate/8 hover:text-brand-navy dark:text-brand-light/60 dark:hover:bg-brand-slate/15 dark:hover:text-brand-light',
                                            )
                                        }
                                    >
                                        <span className="shrink-0">{item.icon}</span>
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 truncate">{item.label}</span>
                                                <ChevronRight size={14} className="opacity-30 shrink-0" />
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {userRole === 'ADMIN' && (
                    <div>
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-slate/60 dark:text-brand-slate/50">
                                {t('navigation.commercial.sections.administration', { defaultValue: 'Administration' })}
                            </p>
                        )}
                        <ul className="space-y-0.5">
                            <li>
                                <NavLink
                                    to="/admin/users"
                                    title={collapsed ? t('navigation.admin.users', { defaultValue: 'Users' }) : undefined}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                                            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                                            isActive
                                                ? 'bg-brand-mint/10 text-brand-mint dark:bg-brand-slate/30 dark:text-brand-mint'
                                                : 'text-brand-slate hover:bg-brand-slate/8 hover:text-brand-navy dark:text-brand-light/60 dark:hover:bg-brand-slate/15 dark:hover:text-brand-light',
                                        )
                                    }
                                >
                                    <Shield size={18} className="shrink-0" />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1">{t('navigation.admin.users', { defaultValue: 'Users' })}</span>
                                            <ChevronRight size={14} className="opacity-30" />
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                )}
            </nav>
        </aside>
    );
}
