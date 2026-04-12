import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAffiliates, useArchivedAffiliates, useCreateAffiliate, useUpdateAffiliate, useDeleteAffiliate, useRestoreAffiliate, type Affiliate } from '../hooks/useAffiliates';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { Users, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import ViewAffiliateContractsModal from '../components/ViewAffiliateContractsModal';
import { EMAIL_LABELS } from '../../../constants/emailLabels';
import { createAffiliateSchema, type AffiliateFormInput, type AffiliateFormValues } from '../schemas/affiliate.schema';

export default function AffiliatesPage() {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createAffiliateSchema(t), [t]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Affiliate | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [contractsViewAff, setContractsViewAff] = useState<Affiliate | null>(null);
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AffiliateFormInput, unknown, AffiliateFormValues>({
        resolver: zodResolver(schema),
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

    const onSubmit = (data: AffiliateFormValues) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-3">
                        <Users className="text-brand-mint" size={28} />
                        Affiliés / Tour Opérateurs
                    </h1>
                    <p className="text-sm text-brand-slate mt-1">{t('auto.features.partners.pages.affiliatespage.5698c3e2', { defaultValue: "Gérez vos partenaires commerciaux" })}</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-mint text-white text-sm font-medium rounded-xl hover:bg-brand-mint/90 transition-colors shadow-sm cursor-pointer">
                    <Plus size={16} /> Nouveau Partenaire
                </button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-brand-slate/10 border border-brand-slate/20 p-6 text-brand-navy text-sm">
                    Impossible de charger les affiliés.
                </div>
            )}

            {!isLoading && !isError && affiliates?.length === 0 && (
                <div className="rounded-xl bg-brand-slate/10 border border-dashed border-brand-slate/25 p-12 text-center">
                    <Users size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.partners.pages.affiliatespage.7087748d', { defaultValue: "Aucun partenaire enregistré" })}</p>
                    <p className="text-brand-slate/70 text-xs mt-1">{t('auto.features.partners.pages.affiliatespage.2965e80c', { defaultValue: "Cliquez sur « Nouveau Partenaire » pour commencer" })}</p>
                </div>
            )}

            {/* Table — compact columns: Nom, Type, Représentant, Email, Actions */}
            {affiliates && affiliates.length > 0 && (
                <div className="bg-white dark:bg-brand-navy rounded-xl border border-brand-slate/15 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light/80 border-b border-brand-slate/15">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.partners.pages.affiliatespage.8827467a', { defaultValue: "Société" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.partners.pages.affiliatespage.55c3ff30', { defaultValue: "Type" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.partners.pages.affiliatespage.0219ccde', { defaultValue: "Représentant" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.partners.pages.affiliatespage.958306b2', { defaultValue: "Email" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">
                                    {t('pages.affiliates.table.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {affiliates.map((aff) => (
                                <tr key={aff.id} className="hover:bg-brand-light/80 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-brand-navy">{aff.companyName}</span>
                                            <span className="text-xs text-brand-slate/70 mt-0.5">{aff.reference || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${aff.affiliateType === 'TOUR_OPERATOR' ? 'bg-brand-mint/10 text-brand-mint' :
                                            aff.affiliateType === 'TRAVEL_AGENCY' ? 'bg-brand-slate/10 text-brand-slate' :
                                                'bg-brand-mint/10 text-brand-mint'
                                            }`}>
                                            {aff.affiliateType?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-brand-slate">{aff.representativeName || '—'}</td>
                                    <td className="px-5 py-3 text-brand-slate">
                                        {aff.emails && aff.emails.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-brand-slate/70">[{aff.emails[0].label}]</span>
                                                <span>{aff.emails[0].address}</span>
                                                {aff.emails.length > 1 && (
                                                    <span className="bg-brand-slate/10 text-brand-slate px-2 py-0.5 rounded-full text-xs font-medium">
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
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer" title={t('auto.features.partners.pages.affiliatespage.title.6389cd97', { defaultValue: "Voir les contrats" })}>
                                                <FileText size={15} />
                                            </button>
                                            <button onClick={() => openEdit(aff)}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer" title={t('auto.features.partners.pages.affiliatespage.title.0b2ca4dc', { defaultValue: "Modifier" })}>
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(aff)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-navy hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50" title={t('auto.features.partners.pages.affiliatespage.title.0f6c8455', { defaultValue: "Supprimer" })}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-brand-light/80 border-t border-brand-slate/10 text-xs text-brand-slate/70">
                        {affiliates.length} partenaire{affiliates.length > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-slate hover:text-brand-navy transition-colors cursor-pointer">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Partenaires archivés {archivedAffiliates ? `(${archivedAffiliates.length})` : ''}
                    </button>

                    {showArchived && archivedAffiliates && archivedAffiliates.length > 0 && (
                        <div className="mt-4 bg-brand-light/80 rounded-xl border border-brand-slate/15 overflow-hidden opacity-80">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-brand-slate/10 border-b border-brand-slate/15">
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.partners.pages.affiliatespage.8827467a', { defaultValue: "Société" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.partners.pages.affiliatespage.0219ccde', { defaultValue: "Représentant" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.partners.pages.affiliatespage.21d528b7', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10">
                                    {archivedAffiliates.map((aff) => (
                                        <tr key={aff.id} className="hover:bg-brand-slate/10 transition-colors">
                                            <td className="px-5 py-3 text-brand-slate font-medium">{aff.companyName}</td>
                                            <td className="px-5 py-3 text-brand-slate/70">{aff.representativeName || '—'}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(aff)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-medium rounded-xl hover:bg-brand-mint/15 transition-colors cursor-pointer disabled:opacity-50">
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
                        <p className="mt-3 text-sm text-brand-slate/70 italic">{t('auto.features.partners.pages.affiliatespage.6bed5020', { defaultValue: "Aucun partenaire archivé" })}</p>
                    )}
                </div>
            )}

            {/* ─── Create / Edit Modal ──────────── */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editing ? `Modifier – ${editing.companyName}` : 'Nouveau Partenaire'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Informations Générales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-brand-navy mb-1">{t('auto.features.partners.pages.affiliatespage.3c42e6b7', { defaultValue: "Nom de la société *" })}</label>
                            <input {...register('companyName')} placeholder={t('auto.features.partners.pages.affiliatespage.placeholder.24e881e1', { defaultValue: "Ex: TUI France" })}
                                className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            {errors.companyName && <p className="text-brand-slate text-xs mt-1">{errors.companyName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1">{t('auto.features.partners.pages.affiliatespage.efdf284a', { defaultValue: "Type de partenaire" })}</label>
                            <select {...register('affiliateType')}
                                className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none bg-white dark:bg-brand-navy">
                                <option value="TOUR_OPERATOR">{t('auto.features.partners.pages.affiliatespage.109fc4fc', { defaultValue: "Tour Opérateur" })}</option>
                                <option value="TRAVEL_AGENCY">{t('auto.features.partners.pages.affiliatespage.4b5a3f34', { defaultValue: "Agence de Voyage" })}</option>
                                <option value="CORPORATE">{t('auto.features.partners.pages.affiliatespage.c3487a68', { defaultValue: "Corporate" })}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1">{t('auto.features.partners.pages.affiliatespage.40cccbf1', { defaultValue: "Représentant légal" })}</label>
                            <input {...register('representativeName')} placeholder={t('auto.features.partners.pages.affiliatespage.placeholder.3b01b337', { defaultValue: "Michel Durand" })}
                                className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                        </div>
                    </div>

                    {/* Emails Dynamiques (CRM Style) */}
                    <div className="pt-4 border-t border-brand-slate/10">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-brand-navy">{t('auto.features.partners.pages.affiliatespage.5d377eb4', { defaultValue: "Emails (CRM)" })}</label>
                            <button
                                type="button"
                                onClick={() => append({ label: 'General', address: '' })}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-mint hover:text-brand-mint transition-colors"
                            >
                                <Plus size={14} /> Ajouter un email
                            </button>
                        </div>
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-3 bg-brand-light/70 p-3 rounded-xl border border-brand-slate/10">
                                    <div className="w-1/3">
                                        <select
                                            {...register(`emails.${index}.label` as const)}
                                            className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none bg-white dark:bg-brand-navy"
                                        >
                                            <option value="">{t('auto.features.partners.pages.affiliatespage.09feda17', { defaultValue: "— Type —" })}</option>
                                            {EMAIL_LABELS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            {...register(`emails.${index}.address` as const)}
                                            placeholder={t('auto.features.partners.pages.affiliatespage.placeholder.2b305725', { defaultValue: "adresse@mail.com" })}
                                            className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none bg-white dark:bg-brand-navy"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2 text-brand-slate/70 hover:text-brand-navy hover:bg-brand-slate/10 rounded-xl transition-colors cursor-pointer mt-0.5"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <p className="text-xs text-brand-slate/70 italic text-center py-2">{t('auto.features.partners.pages.affiliatespage.2d2f6ab1', { defaultValue: "Aucun email défini." })}</p>
                            )}
                        </div>
                    </div>

                    {/* Coordonnées Bancaires */}
                    <div className="pt-4 border-t border-brand-slate/10">
                        <label className="block text-sm font-medium text-brand-navy mb-3">{t('auto.features.partners.pages.affiliatespage.86f9d5fa', { defaultValue: "Coordonnées Bancaires" })}</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-brand-slate/70 mb-1 ml-1">{t('auto.features.partners.pages.affiliatespage.d90e8576', { defaultValue: "Nom de la Banque" })}</label>
                                <input {...register('bankName')} placeholder={t('auto.features.partners.pages.affiliatespage.placeholder.f5223833', { defaultValue: "Banque Populaire" })}
                                    className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-brand-slate/70 mb-1 ml-1">{t('auto.features.partners.pages.affiliatespage.72b41251', { defaultValue: "IBAN" })}</label>
                                <input {...register('iban')} placeholder={t('auto.features.partners.pages.affiliatespage.placeholder.3eb7769b', { defaultValue: "TN59..." })}
                                    className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-brand-slate/70 mb-1 ml-1">{t('auto.features.partners.pages.affiliatespage.ec66f853', { defaultValue: "SWIFT / BIC" })}</label>
                                <input {...register('swift')} placeholder={t('auto.features.partners.pages.affiliatespage.placeholder.a41f1ee7', { defaultValue: "ABCCTN..." })}
                                    className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Autres Détails */}
                    <div className="pt-4 border-t border-brand-slate/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-navy mb-1">{t('auto.features.partners.pages.affiliatespage.0e822787', { defaultValue: "Téléphone" })}</label>
                                <input {...register('phone')}
                                    className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-navy mb-1">{t('auto.features.partners.pages.affiliatespage.df043293', { defaultValue: "Fax" })}</label>
                                <input {...register('fax')}
                                    className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-brand-navy mb-1">{t('auto.features.partners.pages.affiliatespage.c7ebb22b', { defaultValue: "Adresse" })}</label>
                                <input {...register('address')}
                                    className="w-full px-3 py-2 border border-brand-slate/25 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint focus:border-brand-mint outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-slate/10">
                        <button type="button" onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-brand-navy bg-brand-slate/10 rounded-xl hover:bg-brand-slate/15 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button type="submit" disabled={isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint/90 transition-colors disabled:opacity-50 cursor-pointer">
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
