import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAffiliates, useArchivedAffiliates, useCreateAffiliate, useUpdateAffiliate, useDeleteAffiliate, useRestoreAffiliate, type Affiliate, type CreateAffiliatePayload } from '../hooks/useAffiliates';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { Users, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ViewAffiliateContractsModal from '../components/ViewAffiliateContractsModal';
import { EMAIL_LABELS } from '../../../constants/emailLabels';

export default function AffiliatesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Affiliate | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [contractsViewAff, setContractsViewAff] = useState<Affiliate | null>(null);
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateAffiliatePayload>({
        defaultValues: {
            companyName: '',
            affiliateType: 'TOUR_OPERATOR',
            representativeName: '',
            emails: [{ label: 'General', address: '' }],
            bankName: '',
            iban: '',
            swift: '',
            address: '',
            phone: '',
            fax: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'emails',
    });

    const closeModal = () => { setIsModalOpen(false); setEditing(null); reset(); };

    const { data: affiliates, isLoading, isError } = useAffiliates();
    const { data: archivedAffiliates } = useArchivedAffiliates(isAdmin && showArchived);
    const createMutation = useCreateAffiliate(closeModal);
    const updateMutation = useUpdateAffiliate(closeModal);
    const deleteMutation = useDeleteAffiliate();
    const restoreMutation = useRestoreAffiliate();

    const openCreate = () => {
        setEditing(null);
        reset({
            companyName: '',
            affiliateType: 'TOUR_OPERATOR',
            representativeName: '',
            emails: [{ label: 'General', address: '' }],
            bankName: '',
            iban: '',
            swift: '',
            address: '',
            phone: '',
            fax: '',
        });
        setIsModalOpen(true);
    };

    const openEdit = (item: Affiliate) => {
        setEditing(item);
        reset({
            companyName: item.companyName,
            affiliateType: item.affiliateType,
            representativeName: item.representativeName ?? '',
            emails: item.emails?.length ? item.emails : [{ label: 'General', address: '' }],
            bankName: item.bankName ?? '',
            iban: item.iban ?? '',
            swift: item.swift ?? '',
            address: item.address ?? '',
            phone: item.phone ?? '',
            fax: item.fax ?? '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Affiliate) => {
        if (await confirm({
            title: `Archiver le partenaire "${item.companyName}" ?`,
            description: "Le partenaire sera archivé.",
            confirmLabel: "Archiver",
            variant: "danger"
        })) {
            deleteMutation.mutate(item.id);
        }
    };

    const handleRestore = async (item: Affiliate) => {
        if (await confirm({
            title: `Restaurer le partenaire "${item.companyName}" ?`,
            description: "Le partenaire sera de nouveau actif.",
            confirmLabel: "Restaurer",
            variant: "info"
        })) {
            restoreMutation.mutate(item.id);
        }
    };

    const onSubmit = (data: CreateAffiliatePayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="text-indigo-600" size={28} />
                        Affiliés / Tour Opérateurs
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos partenaires commerciaux</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
                    <Plus size={16} /> Nouveau Partenaire
                </button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                    Impossible de charger les affiliés.
                </div>
            )}

            {!isLoading && !isError && affiliates?.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucun partenaire enregistré</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur « Nouveau Partenaire » pour commencer</p>
                </div>
            )}

            {/* Table — compact columns: Nom, Type, Représentant, Email, Actions */}
            {affiliates && affiliates.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Société</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Représentant</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Email</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {affiliates.map((aff) => (
                                <tr key={aff.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{aff.companyName}</span>
                                            <span className="text-xs text-gray-400 mt-0.5">{aff.reference || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${aff.affiliateType === 'TOUR_OPERATOR' ? 'bg-blue-50 text-blue-600' :
                                            aff.affiliateType === 'TRAVEL_AGENCY' ? 'bg-purple-50 text-purple-600' :
                                                'bg-green-50 text-green-600'
                                            }`}>
                                            {aff.affiliateType?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600">{aff.representativeName || '—'}</td>
                                    <td className="px-5 py-3 text-gray-600">
                                        {aff.emails && aff.emails.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">[{aff.emails[0].label}]</span>
                                                <span>{aff.emails[0].address}</span>
                                                {aff.emails.length > 1 && (
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                        +{aff.emails.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => setContractsViewAff(aff)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" title="Voir les contrats">
                                                <FileText size={15} />
                                            </button>
                                            <button onClick={() => openEdit(aff)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" title="Modifier">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(aff)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Supprimer">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                        {affiliates.length} partenaire{affiliates.length > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Partenaires archivés {archivedAffiliates ? `(${archivedAffiliates.length})` : ''}
                    </button>

                    {showArchived && archivedAffiliates && archivedAffiliates.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-200">
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Société</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Représentant</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {archivedAffiliates.map((aff) => (
                                        <tr key={aff.id} className="hover:bg-gray-100 transition-colors">
                                            <td className="px-5 py-3 text-gray-500 font-medium">{aff.companyName}</td>
                                            <td className="px-5 py-3 text-gray-400">{aff.representativeName || '—'}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(aff)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showArchived && archivedAffiliates && archivedAffiliates.length === 0 && (
                        <p className="mt-3 text-sm text-gray-400 italic">Aucun partenaire archivé</p>
                    )}
                </div>
            )}

            {/* ─── Create / Edit Modal ──────────── */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editing ? `Modifier – ${editing.companyName}` : 'Nouveau Partenaire'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Informations Générales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la société *</label>
                            <input {...register('companyName', { required: 'Le nom est requis' })} placeholder="Ex: TUI France"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type de partenaire</label>
                            <select {...register('affiliateType')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                                <option value="TOUR_OPERATOR">Tour Opérateur</option>
                                <option value="TRAVEL_AGENCY">Agence de Voyage</option>
                                <option value="CORPORATE">Corporate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Représentant légal</label>
                            <input {...register('representativeName')} placeholder="Michel Durand"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                    </div>

                    {/* Emails Dynamiques (CRM Style) */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Emails (CRM)</label>
                            <button
                                type="button"
                                onClick={() => append({ label: 'General', address: '' })}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                <Plus size={14} /> Ajouter un email
                            </button>
                        </div>
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    <div className="w-1/3">
                                        <select
                                            {...register(`emails.${index}.label` as const, { required: true })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                        >
                                            <option value="">— Type —</option>
                                            {EMAIL_LABELS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            {...register(`emails.${index}.address` as const, { required: true })}
                                            placeholder="adresse@mail.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-0.5"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <p className="text-xs text-gray-400 italic text-center py-2">Aucun email défini.</p>
                            )}
                        </div>
                    </div>

                    {/* Coordonnées Bancaires */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Coordonnées Bancaires</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Nom de la Banque</label>
                                <input {...register('bankName')} placeholder="Banque Populaire"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">IBAN</label>
                                <input {...register('iban')} placeholder="TN59..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">SWIFT / BIC</label>
                                <input {...register('swift')} placeholder="ABCCTN..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Autres Détails */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input {...register('phone')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                                <input {...register('fax')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input {...register('address')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button type="submit" disabled={isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                            {isPending ? 'Patientez...' : (editing ? 'Enregistrer' : 'Créer')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Contracts View Modal ────────────────────────── */}
            <ViewAffiliateContractsModal
                isOpen={!!contractsViewAff}
                onClose={() => setContractsViewAff(null)}
                affiliateId={contractsViewAff?.id ?? null}
                affiliateName={contractsViewAff?.companyName ?? ''}
            />
        </div>
    );
}
