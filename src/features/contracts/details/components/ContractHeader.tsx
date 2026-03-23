import { ArrowLeft, FileText, Users } from 'lucide-react';
import type { Contract } from '../../types/contract.types';
import StatusDropdown from '../../components/StatusDropdown';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────

interface Props {
    contract: Contract;
    onBack: () => void;
}

export default function ContractHeader({ contract, onBack }: Props) {
    return (
        <div className="bg-white border-b border-gray-200">
            {/* Back button */}
            <div className="px-8 pt-5">
                <button onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                    <ArrowLeft size={16} /> Retour aux contrats
                </button>
            </div>

            {/* Main info */}
            <div className="px-8 py-5">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <FileText size={22} className="text-indigo-600" />
                            <h1 className="text-xl font-bold text-gray-900">{contract.name}</h1>
                            {/* ─── Interactive Status Badge ─── */}
                            <StatusDropdown
                                contractId={contract.id}
                                currentStatus={contract.status}
                                size="md"
                            />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="font-mono text-gray-400">{contract.reference || `#${contract.id}`}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Users size={14} />
                                {(() => {
                                    const affs = contract.affiliates ?? [];
                                    if (affs.length === 0) return '—';
                                    const shown = affs.slice(0, 2).map(a => a.companyName).join(', ');
                                    if (affs.length <= 2) return shown;
                                    return (
                                        <>
                                            {shown}
                                            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                +{affs.length - 2}
                                            </span>
                                        </>
                                    );
                                })()}
                            </span>
                            <span>•</span>
                            <span>
                                {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                            </span>
                            <span>•</span>
                            <span className="font-medium">{contract.currency}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

