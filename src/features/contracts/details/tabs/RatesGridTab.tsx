import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import SmartRatesGrid from '../components/rates-grid/SmartRatesGrid';

export default function RatesGridTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    return <SmartRatesGrid contract={contract} />;
}
