import { NavLink } from 'react-router-dom';
import { FileText, Package, Baby, Contact, CalendarCheck, Gift, Calculator, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

const tabs = [
    { to: 'general', label: 'Général', icon: <FileText size={16} /> },
    { to: 'rates-grid', label: 'Grille Tarifaire', icon: <Calculator size={16} /> },
    { to: 'supplements', label: 'Suppléments', icon: <Package size={16} /> },
    { to: 'reductions', label: 'Réductions', icon: <Baby size={16} /> },
    { to: 'monoparental', label: 'Monoparental', icon: <Contact size={16} /> },
    { to: 'early-bookings', label: 'Early Booking', icon: <CalendarCheck size={16} /> },
    { to: 'spos', label: 'Offres Spéciales', icon: <Gift size={16} /> },
    { to: 'cancellation', label: 'Annulations', icon: <ShieldAlert size={16} /> },
];

export default function ContractTabs() {
    return (
        <div className="bg-white border-b border-gray-200 px-8">
            <nav className="flex gap-1 -mb-px">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end
                        className={({ isActive }) =>
                            clsx(
                                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                isActive
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            )
                        }
                    >
                        {tab.icon} {tab.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
