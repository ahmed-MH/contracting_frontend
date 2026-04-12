import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import SmartRatesGrid from '../components/rates-grid/SmartRatesGrid';
import { useTranslation } from 'react-i18next';

export default function RatesGridTab() {
    const { t } = useTranslation('common');
    void t;
    const { contract } = useOutletContext<ContractOutletContext>();
    return <SmartRatesGrid contract={contract} />;
}
