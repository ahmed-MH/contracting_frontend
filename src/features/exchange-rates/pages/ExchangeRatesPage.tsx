import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GuidedPageHeader } from '../../../components/layout/Workspace';
import { useHotel } from '../../hotel/context/HotelContext';
import ExchangeRatesSection from '../components/ExchangeRatesSection';

export default function ExchangeRatesPage() {
    const { t } = useTranslation('common');
    const { currentHotel, isLoading } = useHotel();

    if (isLoading) {
        return (
            <div className="p-4 md:p-6">
                <div className="premium-surface flex min-h-[360px] items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <GuidedPageHeader
                icon={ArrowRightLeft}
                kicker={t('pages.exchangeRates.header.eyebrow', { defaultValue: 'Financial Settings' })}
                title={t('pages.exchangeRates.header.title', { defaultValue: 'Exchange rates' })}
                description={t('pages.exchangeRates.header.subtitle', {
                    defaultValue: 'Manage currency pairs used for previews, PDF exports, and pricing calculations.',
                })}
            />

            {!currentHotel ? (
                <section className="premium-surface border-dashed p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint">
                        <ArrowRightLeft size={30} />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-brand-navy dark:text-brand-light">
                        {t('pages.exchangeRates.emptyHotelTitle', { defaultValue: 'No hotel selected' })}
                    </h2>
                    <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                        {t('pages.exchangeRates.emptyHotelSubtitle', { defaultValue: 'Choose a property before managing exchange rates.' })}
                    </p>
                </section>
            ) : (
                <ExchangeRatesSection />
            )}
        </div>
    );
}
