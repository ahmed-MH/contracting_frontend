import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Hotel,
    BedDouble,
    UtensilsCrossed,
    Package,
    Baby,
    Users,
    FileText,
    ChevronRight,
    ChevronsUpDown,
    Shield,
    LogOut,
    Contact,
    CalendarCheck,
    PanelLeftClose,
    PanelLeftOpen,
    Gift,
    ShieldAlert,
    Calculator
} from 'lucide-react';
import { clsx } from 'clsx';
import { useHotel } from '../features/hotel/context/HotelContext';
import { useAuth } from '../features/auth/context/AuthContext';

interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
}

const menuSections: { title: string; items: NavItem[] }[] = [
    {
        title: 'Mon Produit',
        items: [
            { label: 'Hôtel', to: '/product/hotel', icon: <Hotel size={18} /> },
            { label: 'Chambres', to: '/product/rooms', icon: <BedDouble size={18} /> },
            { label: 'Arrangements', to: '/product/arrangements', icon: <UtensilsCrossed size={18} /> },
            { label: 'Suppléments', to: '/product/supplements', icon: <Package size={18} /> },
            { label: 'Offres Spéciales', to: '/product/spos', icon: <Gift size={18} /> },
            { label: 'Réductions', to: '/product/reductions', icon: <Baby size={18} /> },
            { label: 'Monoparental', to: '/product/monoparental', icon: <Contact size={18} /> },
            { label: 'Early Booking', to: '/product/early-bookings', icon: <CalendarCheck size={18} /> },
            { label: 'Annulations', to: '/product/cancellations', icon: <ShieldAlert size={18} /> },
        ],
    },
    {
        title: 'Mes Partenaires',
        items: [
            { label: 'Affiliés / TO', to: '/partners/affiliates', icon: <Users size={18} /> },
        ],
    },
    {
        title: 'Gestion Contrats',
        items: [
            { label: 'Liste des contrats', to: '/contracts', icon: <FileText size={18} /> },
            { label: 'Simulateur de Prix', to: '/simulator', icon: <Calculator size={18} /> },
        ],
    },
];

export default function CommercialLayout() {
    const { currentHotel, availableHotels, isLoading, switchHotel } = useHotel();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* ─── Sidebar ────────────────────────────────────────── */}
            <aside
                className={clsx(
                    'bg-gray-900 text-gray-300 flex flex-col shrink-0 transition-all duration-300 ease-in-out',
                    collapsed ? 'w-[68px]' : 'w-64',
                )}
            >
                {/* Brand + Toggle */}
                <div className={clsx(
                    'flex items-center border-b border-gray-800 transition-all duration-300',
                    collapsed ? 'px-3 py-4 justify-center' : 'px-5 py-5',
                )}>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-bold text-white tracking-tight truncate">
                                Contracting Manager
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">Espace Commercial</p>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={clsx(
                            'p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer shrink-0',
                            collapsed && 'mx-auto',
                        )}
                        title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
                    >
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={clsx(
                    'flex-1 overflow-y-auto py-4 space-y-6 transition-all duration-300',
                    collapsed ? 'px-2' : 'px-3',
                )}>
                    {menuSections.map((section) => (
                        <div key={section.title}>
                            {!collapsed && (
                                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
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
                                                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                                                    collapsed
                                                        ? 'justify-center px-0 py-2.5'
                                                        : 'gap-3 px-3 py-2',
                                                    isActive
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'hover:bg-gray-800 hover:text-white',
                                                )
                                            }
                                        >
                                            <span className="shrink-0">{item.icon}</span>
                                            {!collapsed && (
                                                <>
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    <ChevronRight size={14} className="opacity-40 shrink-0" />
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Admin section — visible only to ADMIN */}
                    {user?.role === 'ADMIN' && (
                        <div>
                            {!collapsed && (
                                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                                    Administration
                                </p>
                            )}
                            <ul className="space-y-0.5">
                                <li>
                                    <NavLink
                                        to="/admin/users"
                                        title={collapsed ? 'Utilisateurs' : undefined}
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center rounded-lg text-sm font-medium transition-colors',
                                                collapsed
                                                    ? 'justify-center px-0 py-2.5'
                                                    : 'gap-3 px-3 py-2',
                                                isActive
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'hover:bg-gray-800 hover:text-white',
                                            )
                                        }
                                    >
                                        <Shield size={18} />
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1">Utilisateurs</span>
                                                <ChevronRight size={14} className="opacity-40" />
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    )}
                </nav>
            </aside>

            {/* ─── Right Column (Header + Content) ──────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* ─── Top Header Bar ───────────────────────────── */}
                <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
                    {/* Left: Hotel Switcher */}
                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
                        ) : availableHotels.length <= 1 ? (
                            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                                <Hotel size={16} className="text-indigo-600 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{currentHotel?.name ?? '—'}</span>
                                    {currentHotel?.reference && (
                                        <span className="text-[10px] text-gray-400 font-mono tracking-wide">{currentHotel.reference}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={currentHotel?.id ?? ''}
                                    onChange={(e) => switchHotel(Number(e.target.value))}
                                    className="appearance-none bg-gray-50 text-gray-900 text-sm font-medium pl-9 pr-8 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    {availableHotels.map((h) => (
                                        <option key={h.id} value={h.id}>
                                            {h.reference ? `[${h.reference}]` : ''}{h.name}
                                        </option>
                                    ))}
                                </select>
                                <Hotel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none" />
                                <ChevronsUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Right: User + Logout */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div className="hidden sm:flex flex-col min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <button
                            onClick={handleLogout}
                            title="Se déconnecter"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                {/* ─── Main Content ──────────────────────────────── */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
