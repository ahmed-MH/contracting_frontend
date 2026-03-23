import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { type CreateContractPayload } from '../services/contract.service';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useArrangements } from '../../arrangements/hooks/useArrangements';
import { useContracts, useCreateContract } from '../hooks/useContracts';
import { FileText, Plus, ExternalLink } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { STATUS_CONFIG } from '../components/StatusDropdown';
import type { ContractStatus } from '../types/contract.types';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ status }: { status: ContractStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}


export default function ContractsList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const { data: contracts, isLoading, isError } = useContracts();
    const { data: affiliates = [] } = useAffiliates();
    const { data: arrangements = [] } = useArrangements();
    const createMutation = useCreateContract();

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateContractPayload>({
        defaultValues: {
            name: '',
            startDate: '',
            endDate: '',
            currency: 'TND',
            affiliateIds: [],
            baseArrangementId: null as number | null,
        },
    });

    const selectedAffiliateIds = watch('affiliateIds');
    const toggleAffiliate = (id: number) => {
        const cur = selectedAffiliateIds ?? [];
        setValue('affiliateIds', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], { shouldValidate: true });
    };

    const openCreate = () => {
        reset({ name: '', startDate: '', endDate: '', currency: 'TND', affiliateIds: [], baseArrangementId: null });
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); reset(); };

    const onSubmit = (data: CreateContractPayload) => {
        const payload = {
            ...data,
            baseArrangementId: data.baseArrangementId ? Number(data.baseArrangementId) : null
        };
        createMutation.mutate(payload, {
            onSuccess: () => closeModal()
        });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-indigo-600" size={28} />
                        Gestion des Contrats
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Créez et gérez vos contrats partenaires</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
                    <Plus size={16} /> Nouveau Contrat
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                    Impossible de charger les contrats.
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && contracts?.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucun contrat enregistré</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur « Nouveau Contrat » pour commencer</p>
                </div>
            )}

            {/* Table */}
            {contracts && contracts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Partenaire</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Début</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Fin</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Statut</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contracts.map((c) => {
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{c.name}</span>
                                                <span className="text-xs text-gray-400 mt-0.5 font-mono tracking-wide">{c.reference || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">
                                            {(() => {
                                                const affs = c.affiliates ?? [];
                                                if (affs.length === 0) return '—';
                                                const shown = affs.slice(0, 2).map(a => a.companyName).join(', ');
                                                if (affs.length <= 2) return shown;
                                                return (
                                                    <span>
                                                        {shown}
                                                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                            +{affs.length - 2} autres
                                                        </span>
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-5 py-3 text-center text-gray-600 text-xs">{formatDate(c.startDate)}</td>
                                        <td className="px-5 py-3 text-center text-gray-600 text-xs">{formatDate(c.endDate)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => navigate(`/contracts/${c.id}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                                                <ExternalLink size={13} /> Ouvrir
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                        {contracts.length} contrat{contracts.length > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* ─── Create Modal ────────────────────────────────── */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title="Nouveau Contrat">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                        <input
                            {...register('currency', { required: 'Requis' })}
                            placeholder="TND"
                            maxLength={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contrat</label>
                        <input
                            {...register('name', { required: 'Le nom est requis' })}
                            placeholder="Contrat Été 2025 – TUI"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partenaires</label>
                        <input type="hidden" {...register('affiliateIds', {
                            validate: (v) => (v && v.length > 0) || 'Sélectionnez au moins un partenaire',
                        })} />
                        <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {affiliates.length === 0 && (
                                <p className="text-xs text-gray-400 px-2 py-1">Aucun partenaire disponible</p>
                            )}
                            {affiliates.map((aff) => (
                                <label key={aff.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedAffiliateIds?.includes(aff.id) ?? false}
                                        onChange={() => toggleAffiliate(aff.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    {aff.companyName}
                                </label>
                            ))}
                        </div>
                        {errors.affiliateIds && <p className="text-red-500 text-xs mt-1">{errors.affiliateIds.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                            <input type="date"
                                {...register('startDate', { required: 'Requis' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                            <input type="date"
                                {...register('endDate', {
                                    required: 'Requis',
                                    validate: (value, formValues) =>
                                        !formValues.startDate || new Date(value) > new Date(formValues.startDate)
                                        || 'La fin doit être après le début',
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrangement de base</label>
                        <select
                            {...register('baseArrangementId')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="">Aucun (Toutes les pensions autorisées)</option>
                            {arrangements.map(a => (
                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button type="submit" disabled={createMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                            {createMutation.isPending ? 'Création...' : 'Créer le contrat'}
                        </button>
                    </div>
                    {createMutation.isError && (
                        <p className="text-red-500 text-xs mt-2">Erreur lors de la création. Vérifiez les données.</p>
                    )}
                </form>
            </Modal>
        </div>
    );
}
