import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const tabs = [
    { to: '/admin/integrations/overview', key: 'overview' },
    { to: '/admin/integrations/users', key: 'users' },
    { to: '/admin/integrations/keys', key: 'keys' },
    { to: '/admin/integrations/endpoints', key: 'endpoints' },
    { to: '/admin/integrations/playground', key: 'playground' },
    { to: '/admin/integrations/logs', key: 'logs' },
    { to: '/admin/integrations/docs', key: 'docs' },
] as const;

export default function IntegrationSectionTabs() {
    const { t } = useTranslation('common');

    return (
        <nav className="flex max-w-full min-w-0 gap-2 overflow-x-auto rounded-2xl border border-brand-light/65 bg-brand-light/55 p-1 shadow-inner dark:border-brand-light/10 dark:bg-brand-navy/35" aria-label={t('navigation.admin.overview.integrations.label')}>
            {tabs.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={({ isActive }) => [
                        'whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-mint/30',
                        isActive
                            ? 'bg-brand-navy text-brand-light shadow-md dark:bg-brand-light/12'
                            : 'text-brand-slate hover:bg-brand-light/75 hover:text-brand-navy dark:text-brand-light/70 dark:hover:bg-brand-light/8 dark:hover:text-brand-light',
                    ].join(' ')}
                >
                    {t(`pages.integrations.tabs.${tab.key}`)}
                </NavLink>
            ))}
        </nav>
    );
}
