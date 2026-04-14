import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import SmartRatesGrid from '../components/rates-grid/SmartRatesGrid';
import { useTranslation } from 'react-i18next';
import { Calculator } from 'lucide-react';
import { ContractSectionShell } from '../components/ContractSection';

export default function RatesGridTab() {
    const { t } = useTranslation('common');
    const { contract } = useOutletContext<ContractOutletContext>();
    return (
        <ContractSectionShell
            icon={Calculator}
            title={t('pages.contractDetails.rates.title', { defaultValue: 'Rates Grid' })}
            description={t('pages.contractDetails.rates.description', {
                defaultValue: 'Maintain contracted prices by period, room category, and board arrangement.',
            })}
        >
            <SmartRatesGrid contract={contract} />
        </ContractSectionShell>
    );
}
