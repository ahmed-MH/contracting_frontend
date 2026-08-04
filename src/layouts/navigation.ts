import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    BedDouble,
    Briefcase,
    Calculator,
    CalendarCheck,
    CircleDollarSign,
    Contact,
    FileText,
    Gift,
    Hotel,
    Package,
    Shield,
    ShieldAlert,
    Sparkles,
    Users,
    UtensilsCrossed,
} from 'lucide-react';
import type { UserRole } from '../features/auth/types/auth.types';

export interface NavigationItem {
    label: string;
    labelKey?: string;
    to: string;
    icon: LucideIcon;
    description?: string;
    descriptionKey?: string;
    matchPrefixes?: string[];
    exact?: boolean;
}

export interface NavigationSection {
    title: string;
    titleKey?: string;
    items: NavigationItem[];
}

export interface RoleNavigationConfig {
    role: UserRole;
    label: string;
    labelKey?: string;
    eyebrow: string;
    eyebrowKey?: string;
    title: string;
    titleKey?: string;
    subtitle: string;
    subtitleKey?: string;
    defaultPath: string;
    sections: NavigationSection[];
}

export const adminSections: NavigationSection[] = [
    {
        title: 'Overview',
        titleKey: 'common:navigation.admin.overview.title',
        items: [
            {
                label: 'Organization',
                labelKey: 'common:navigation.admin.overview.organization.label',
                to: '/organization',
                icon: Briefcase,
                description: 'Team pulse, access, and hotels.',
                descriptionKey: 'common:navigation.admin.overview.organization.description',
            },
            {
                label: 'Team',
                labelKey: 'common:navigation.admin.overview.team.label',
                to: '/admin/users',
                icon: Users,
                description: 'Invitations, roles, and access hygiene.',
                descriptionKey: 'common:navigation.admin.overview.team.description',
                matchPrefixes: ['/admin/users'],
            },
            {
                label: 'Integrations',
                labelKey: 'common:navigation.admin.overview.integrations.label',
                to: '/admin/integrations/overview',
                icon: Shield,
                description: 'API users, keys, endpoint controls, and request logs.',
                descriptionKey: 'common:navigation.admin.overview.integrations.description',
                matchPrefixes: ['/admin/integrations'],
            },
            {
                label: 'Hotel Information',
                labelKey: 'common:navigation.commercial.product.hotelInformation',
                to: '/hotel-setup/hotel-information',
                icon: Hotel,
                description: 'Hotel identity, contacts, and legal details.',
                descriptionKey: 'common:navigation.admin.overview.portfolio.description',
                matchPrefixes: ['/hotel-setup/hotel-information'],
            },
            {
                label: 'Exchange Rates',
                labelKey: 'common:navigation.commercial.product.exchangeRates',
                to: '/hotel-setup/exchange-rates',
                icon: CircleDollarSign,
                description: 'Currency pairs used by previews, exports, and simulations.',
                descriptionKey: 'common:navigation.commercial.product.exchangeRatesDescription',
                matchPrefixes: ['/hotel-setup/exchange-rates'],
            },
        ],
    },
    {
        title: 'Commercial Ops',
        titleKey: 'common:navigation.admin.commercialOps.title',
        items: [
            {
                label: 'Contracts',
                labelKey: 'common:navigation.admin.commercialOps.contracts.label',
                to: '/contracts',
                icon: FileText,
                description: 'Commercial terms and lifecycle control.',
                descriptionKey: 'common:navigation.admin.commercialOps.contracts.description',
                matchPrefixes: ['/contracts'],
            },
            {
                label: 'Simulator',
                labelKey: 'common:navigation.admin.commercialOps.simulator.label',
                to: '/simulator',
                icon: Calculator,
                description: 'Spot-check contracted selling prices.',
                descriptionKey: 'common:navigation.admin.commercialOps.simulator.description',
            },
            {
                label: 'Saved Invoices',
                to: '/proforma/invoices',
                icon: FileText,
                description: 'Issued invoice history and re-downloads.',
                matchPrefixes: ['/proforma/invoices'],
            },
        ],
    },
];

export const commercialPrimaryTabs: NavigationItem[] = [
    {
        label: 'Hotel Information',
        labelKey: 'common:navigation.commercial.product.hotelInformation',
        to: '/hotel-setup/hotel-information',
        icon: Hotel,
        description: 'Hotel setup and operating parameters.',
        descriptionKey: 'common:navigation.commercial.primary.hotels.description',
        matchPrefixes: ['/hotel-setup/hotel-information'],
    },
    {
        label: 'Partners',
        labelKey: 'common:navigation.commercial.primary.partners.label',
        to: '/partners/affiliates',
        icon: Users,
        description: 'Distribution partners and tour operators.',
        descriptionKey: 'common:navigation.commercial.primary.partners.description',
        matchPrefixes: ['/partners'],
    },
    {
        label: 'Catalogue',
        labelKey: 'common:navigation.commercial.primary.catalog.label',
        to: '/product/rooms',
        icon: Package,
        description: 'Rooms, arrangements, extras, and pricing rules.',
        descriptionKey: 'common:navigation.commercial.primary.catalog.description',
        matchPrefixes: [
            '/product/rooms',
            '/product/arrangements',
            '/product/supplements',
            '/product/spos',
            '/product/reductions',
            '/product/monoparental',
            '/product/early-bookings',
            '/product/cancellations',
        ],
    },
    {
        label: 'Contracts',
        labelKey: 'common:navigation.commercial.primary.contracts.label',
        to: '/contracts',
        icon: FileText,
        description: 'Draft, negotiate, and publish agreements.',
        descriptionKey: 'common:navigation.commercial.primary.contracts.description',
        matchPrefixes: ['/contracts'],
    },
    {
        label: 'Simulator',
        labelKey: 'common:navigation.commercial.primary.simulator.label',
        to: '/simulator',
        icon: Calculator,
        description: 'Calculate guest-facing prices instantly.',
        descriptionKey: 'common:navigation.commercial.primary.simulator.description',
    },
];

export const commercialProductTabs: NavigationItem[] = [
    { label: 'Hotel Information', labelKey: 'common:navigation.commercial.product.hotelInformation', to: '/hotel-setup/hotel-information', icon: Hotel },
    { label: 'Rooms', labelKey: 'common:navigation.commercial.product.rooms', to: '/product/rooms', icon: BedDouble },
    { label: 'Arrangements', labelKey: 'common:navigation.commercial.product.arrangements', to: '/product/arrangements', icon: UtensilsCrossed },
    { label: 'Supplements', labelKey: 'common:navigation.commercial.product.supplements', to: '/product/supplements', icon: Package },
    { label: 'SPOs', labelKey: 'common:navigation.commercial.product.spos', to: '/product/spos', icon: Gift },
    { label: 'Reductions', labelKey: 'common:navigation.commercial.product.reductions', to: '/product/reductions', icon: Sparkles },
    { label: 'Monoparental', labelKey: 'common:navigation.commercial.product.monoparental', to: '/product/monoparental', icon: Contact },
    { label: 'Early Booking', labelKey: 'common:navigation.commercial.product.earlyBooking', to: '/product/early-bookings', icon: CalendarCheck },
    { label: 'Cancellations', labelKey: 'common:navigation.commercial.product.cancellations', to: '/product/cancellations', icon: ShieldAlert },
];

export const commercialWorkspaceSections: NavigationSection[] = [
    {
        title: 'Hotel Setup',
        titleKey: 'common:navigation.commercial.workspace.hotelSetup',
        items: [
            {
                label: 'Hotel Information',
                labelKey: 'common:navigation.commercial.product.hotelInformation',
                to: '/hotel-setup/hotel-information',
                icon: Hotel,
                description: 'Hotel identity, contacts, legal details, and operating metadata.',
                descriptionKey: 'common:navigation.commercial.product.hotelInformationDescription',
                matchPrefixes: ['/hotel-setup/hotel-information'],
            },
            {
                label: 'Rooms',
                labelKey: 'common:navigation.commercial.product.rooms',
                to: '/product/rooms',
                icon: BedDouble,
                description: 'Room types and sellable inventory.',
                descriptionKey: 'common:navigation.commercial.product.roomsDescription',
                matchPrefixes: ['/product/rooms'],
            },
            {
                label: 'Arrangements',
                labelKey: 'common:navigation.commercial.product.arrangements',
                to: '/product/arrangements',
                icon: UtensilsCrossed,
                description: 'Board bases used by contracts and rates.',
                descriptionKey: 'common:navigation.commercial.product.arrangementsDescription',
                matchPrefixes: ['/product/arrangements'],
            },
            {
                label: 'Exchange Rates',
                labelKey: 'common:navigation.commercial.product.exchangeRates',
                to: '/hotel-setup/exchange-rates',
                icon: CircleDollarSign,
                description: 'Currency pairs used by previews, exports, and simulations.',
                descriptionKey: 'common:navigation.commercial.product.exchangeRatesDescription',
                matchPrefixes: ['/hotel-setup/exchange-rates'],
            },
        ],
    },
    {
        title: 'Partners',
        titleKey: 'common:navigation.commercial.workspace.partners',
        items: [
            {
                label: 'Affiliates',
                labelKey: 'common:navigation.commercial.primary.partners.label',
                to: '/partners/affiliates',
                icon: Users,
                description: 'Tour operators and distribution partners.',
                matchPrefixes: ['/partners'],
            },
        ],
    },
    {
        title: 'Catalog',
        titleKey: 'common:navigation.commercial.workspace.catalog',
        items: [
            { label: 'Supplements', labelKey: 'common:navigation.commercial.product.supplements', to: '/product/supplements', icon: Package, matchPrefixes: ['/product/supplements'] },
            { label: 'Reductions', labelKey: 'common:navigation.commercial.product.reductions', to: '/product/reductions', icon: Sparkles, matchPrefixes: ['/product/reductions'] },
            { label: 'SPO', labelKey: 'common:navigation.commercial.product.spos', to: '/product/spos', icon: Gift, matchPrefixes: ['/product/spos'] },
            { label: 'Early Booking', labelKey: 'common:navigation.commercial.product.earlyBooking', to: '/product/early-bookings', icon: CalendarCheck, matchPrefixes: ['/product/early-bookings'] },
            { label: 'Monoparental', labelKey: 'common:navigation.commercial.product.monoparental', to: '/product/monoparental', icon: Contact, matchPrefixes: ['/product/monoparental'] },
            { label: 'Cancellation', labelKey: 'common:navigation.commercial.product.cancellations', to: '/product/cancellations', icon: ShieldAlert, matchPrefixes: ['/product/cancellations'] },
        ],
    },
    {
        title: 'Contracts',
        titleKey: 'common:navigation.commercial.workspace.contracts',
        items: [
            {
                label: 'Contracts list',
                labelKey: 'common:navigation.commercial.primary.contracts.label',
                to: '/contracts',
                icon: FileText,
                description: 'Agreement roster and lifecycle status.',
                exact: true,
            },
            {
                label: 'Contract details',
                labelKey: 'common:navigation.commercial.workspace.contractDetails',
                to: '/contracts',
                icon: Briefcase,
                description: 'Periods, rooms, rates, and rule workbench.',
                matchPrefixes: ['/contracts/'],
            },
        ],
    },
    {
        title: 'Tools',
        titleKey: 'common:navigation.commercial.workspace.tools',
        items: [
            {
                label: 'Simulator',
                labelKey: 'common:navigation.commercial.primary.simulator.label',
                to: '/simulator',
                icon: Calculator,
                description: 'Calculate contracted prices for a stay.',
                matchPrefixes: ['/simulator'],
            },
            {
                label: 'Saved invoices',
                to: '/proforma/invoices',
                icon: FileText,
                description: 'Issued invoice archive and re-download workspace.',
                matchPrefixes: ['/proforma/invoices'],
            },
        ],
    },
];

export const commercialTopNavGroups: NavigationSection[] = commercialWorkspaceSections.filter((section) =>
    ['Hotel Setup', 'Partners', 'Catalog'].includes(section.title),
);

export const commercialTopNavItems: NavigationItem[] = [
    {
        label: 'Overview',
        labelKey: 'common:navigation.commercial.primary.overview.label',
        to: '/overview',
        icon: Activity,
        description: 'Commercial KPIs, readiness, and attention queue.',
        descriptionKey: 'common:navigation.commercial.primary.overview.description',
        exact: true,
    },
    {
        label: 'Contracts',
        labelKey: 'common:navigation.commercial.primary.contracts.label',
        to: '/contracts',
        icon: FileText,
        description: 'Agreement roster and lifecycle status.',
        matchPrefixes: ['/contracts'],
    },
    {
        label: 'Simulator',
        labelKey: 'common:navigation.commercial.primary.simulator.label',
        to: '/simulator',
        icon: Calculator,
        description: 'Calculate contracted prices for a stay.',
        matchPrefixes: ['/simulator'],
    },
    {
        label: 'Invoices',
        labelKey: 'common:navigation.commercial.primary.invoices.label',
        to: '/proforma/invoices',
        icon: FileText,
        description: 'Issued invoice archive and re-download workspace.',
        matchPrefixes: ['/proforma/invoices'],
    },
];

export const agentTabs: NavigationItem[] = [
    {
        label: 'Simulator',
        labelKey: 'common:navigation.agent.simulator.label',
        to: '/simulator',
        icon: Calculator,
        description: 'Tool-centric price validation.',
        descriptionKey: 'common:navigation.agent.simulator.description',
    },
];

const roleConfigs: Record<UserRole, RoleNavigationConfig> = {
    ADMIN: {
        role: 'ADMIN',
        label: 'Admin',
        labelKey: 'common:navigation.roles.admin.label',
        eyebrow: 'Organization Pilot',
        eyebrowKey: 'common:navigation.roles.admin.eyebrow',
        title: 'Organization Cockpit',
        titleKey: 'common:navigation.roles.admin.title',
        subtitle: 'Keep team access and the hotel portfolio aligned.',
        subtitleKey: 'common:navigation.roles.admin.subtitle',
        defaultPath: '/organization',
        sections: adminSections,
    },
    COMMERCIAL: {
        role: 'COMMERCIAL',
        label: 'Commercial',
        labelKey: 'common:navigation.roles.commercial.label',
        eyebrow: 'Production Workspace',
        eyebrowKey: 'common:navigation.roles.commercial.eyebrow',
        title: 'Commercial Work Desk',
        titleKey: 'common:navigation.roles.commercial.title',
        subtitle: 'Stay in flow while editing inventory, partners, and contract data.',
        subtitleKey: 'common:navigation.roles.commercial.subtitle',
        defaultPath: '/overview',
        sections: commercialWorkspaceSections,
    },
    AGENT: {
        role: 'AGENT',
        label: 'Agent',
        labelKey: 'common:navigation.roles.agent.label',
        eyebrow: 'Calculation Tool',
        eyebrowKey: 'common:navigation.roles.agent.eyebrow',
        title: 'Rate Simulation',
        titleKey: 'common:navigation.roles.agent.title',
        subtitle: 'A focused calculation environment with instant pricing feedback.',
        subtitleKey: 'common:navigation.roles.agent.subtitle',
        defaultPath: '/simulator',
        sections: [{ title: 'Tools', titleKey: 'common:navigation.roles.agent.sectionTitle', items: agentTabs }],
    },
};

export function getRoleNavigation(role?: UserRole | null): RoleNavigationConfig {
    return roleConfigs[role ?? 'COMMERCIAL'];
}

export function getDefaultPathForRole(role?: UserRole | null): string {
    return getRoleNavigation(role).defaultPath;
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
    if (item.exact) {
        return pathname === item.to;
    }

    if (pathname === item.to) {
        return true;
    }

    return (item.matchPrefixes ?? []).some((prefix) => pathname.startsWith(prefix));
}

export function isProductRoute(pathname: string): boolean {
    return pathname.startsWith('/product/');
}

export function isCatalogRoute(pathname: string): boolean {
    return isProductRoute(pathname);
}

export function isContractRoute(pathname: string): boolean {
    return pathname.startsWith('/contracts');
}
