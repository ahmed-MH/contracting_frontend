import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { useForm } from 'react-hook-form';
import { useUpdateContract } from '../../hooks/useContracts';
import { useAffiliates } from '../../../partners/hooks/useAffiliates';
import { useArrangements } from '../../../arrangements/hooks/useArrangements';
import { Save } from 'lucide-react';

interface FormValues {
    name: string;
    startDate: string;
    endDate: string;
    currency: string;
    affiliateIds: number[];
    baseArrangementId: number | string | null;
    paymentCondition: string;
    depositAmount: number;
    creditDays: number;
    paymentMethods: string[];
}

function toInputDate(iso: string): string {
    return iso ? iso.substring(0, 10) : '';
}

export default function GeneralTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { data: affiliates } = useAffiliates();
    const { data: arrangements } = useArrangements();
    const updateMutation = useUpdateContract(contract.id);

    const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<FormValues>({
        defaultValues: {
            name: contract.name,
            startDate: toInputDate(contract.startDate),
            endDate: toInputDate(contract.endDate),
            currency: contract.currency,
            affiliateIds: contract.affiliates?.map((a) => a.id) ?? [],
            baseArrangementId: contract.baseArrangementId ?? contract.baseArrangement?.id ?? '',
            paymentCondition: contract.paymentCondition ?? 'PREPAYMENT_100',
            depositAmount: contract.depositAmount ?? 0,
            creditDays: contract.creditDays ?? 0,
            paymentMethods: contract.paymentMethods ?? [],
        },
    });

    // Handle external reloads properly
    useEffect(() => {
        reset({
            name: contract.name,
            startDate: toInputDate(contract.startDate),
            endDate: toInputDate(contract.endDate),
            currency: contract.currency,
            affiliateIds: contract.affiliates?.map((a) => a.id) ?? [],
            baseArrangementId: contract.baseArrangementId ?? contract.baseArrangement?.id ?? '',
            paymentCondition: contract.paymentCondition ?? 'PREPAYMENT_100',
            depositAmount: contract.depositAmount ?? 0,
            creditDays: contract.creditDays ?? 0,
            paymentMethods: contract.paymentMethods ?? [],
        });
    }, [contract, reset]);

    const selectedIds = watch('affiliateIds') || [];
    const paymentCondition = watch('paymentCondition');
    const paymentMethods = watch('paymentMethods') || [];

    const toggleAffiliate = (id: number) => {
        setValue('affiliateIds', selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id], { shouldDirty: true });
    };

    const togglePaymentMethod = (method: string) => {
        setValue('paymentMethods', paymentMethods.includes(method) ? paymentMethods.filter((x) => x !== method) : [...paymentMethods, method], { shouldDirty: true });
    };

    const onSubmit = (data: FormValues) => {
        updateMutation.mutate({
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            currency: data.currency,
            affiliateIds: data.affiliateIds,
            baseArrangementId: data.baseArrangementId ? Number(data.baseArrangementId) : null,
            paymentCondition: data.paymentCondition,
            depositAmount: Number(data.depositAmount),
            creditDays: Number(data.creditDays),
            paymentMethods: data.paymentMethods,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full pb-16">
            
            {/* ─── Header ────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-10">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Paramètres du Contrat</h2>
                    <p className="text-sm text-gray-500 mt-1">Configurez l'identité, les dates, les partenaires et les règles de paiement.</p>
                </div>
                <button
                    type="submit"
                    disabled={!isDirty || updateMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer space-x-1"
                >
                    {updateMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    <span>Enregistrer</span>
                    {isDirty && <span className="text-indigo-300 font-bold ml-1">*</span>}
                </button>
            </div>

            <div className="space-y-12">
                
                {/* ─── Section 1: Identité ───────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-gray-900">Identité & Partenaires</h3>
                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                            Le libellé interne du contrat et les Tour Opérateurs qui y seront rattachés.
                        </p>
                    </div>
                    
                    <div className="lg:col-span-3 space-y-6">
                        <div className="max-w-xl">
                            <label className="block text-sm font-medium text-gray-900 mb-1.5">Nom / Libellé du contrat</label>
                            <input
                                type="text"
                                {...register('name', { required: true })}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 border-b border-gray-100 pb-2">
                                <label className="block text-sm font-medium text-gray-900">Tour Opérateurs (Affiliés)</label>
                                <span className="text-xs font-medium text-gray-500">{selectedIds.length} sélectionné(s)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {affiliates?.length === 0 && (
                                    <div className="col-span-full py-4 text-sm text-gray-500">Aucun partenaire disponible</div>
                                )}
                                {affiliates?.map((a) => (
                                    <label 
                                        key={a.id} 
                                        className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedIds.includes(a.id) ? 'bg-indigo-50/20 border-indigo-300 shadow-sm ring-1 ring-indigo-50' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds?.includes(a.id) ?? false}
                                            onChange={() => toggleAffiliate(a.id)}
                                            className="mt-0.5 w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-600 cursor-pointer transition-colors"
                                        />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`text-sm font-medium truncate ${selectedIds.includes(a.id) ? 'text-indigo-900' : 'text-gray-900'}`}>{a.companyName}</span>
                                            {a.reference && <span className="text-xs text-gray-400 font-mono mt-0.5">{a.reference}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* ─── Section 2: Validité ───────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-gray-900">Période & Devise</h3>
                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                            Délimitation des dates d'application et la devise de référence pour tous les tarifs associés.
                        </p>
                    </div>
                    
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">Date de début</label>
                                <input
                                    type="date"
                                    {...register('startDate', { required: true })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">Date de fin</label>
                                <input
                                    type="date"
                                    {...register('endDate', { required: true })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1.5">Devise d'application</label>
                                <select
                                    {...register('currency', { required: true })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm cursor-pointer"
                                >
                                    <option value="EUR">EUR — Euro (€)</option>
                                    <option value="USD">USD — Dollar US ($)</option>
                                    <option value="GBP">GBP — Livre Sterling (£)</option>
                                    <option value="TND">TND — Dinar Tunisien (د.ت)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* ─── Section 3: Règles ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-gray-900">Spécifications</h3>
                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                            Contrainte sur l'arrangement de base.
                        </p>
                    </div>
                    
                    <div className="lg:col-span-3">
                        <div className="max-w-xl">
                            <label className="block text-sm font-medium text-gray-900 mb-1.5">Arrangement strict (Optionnel)</label>
                            <select
                                {...register('baseArrangementId')}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm cursor-pointer"
                            >
                                <option value="">Aucun (Multi-pension autorisée dans les tarifs)</option>
                                {arrangements?.map(a => (
                                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* ─── Section 4: Paiement ───────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12">
                    <div className="lg:col-span-1">
                        <h3 className="text-sm font-semibold text-gray-900">Facturation & Paiement</h3>
                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                            Les conditions de libération et méthodes de règlement.
                        </p>
                    </div>
                    
                    <div className="lg:col-span-3 max-w-4xl space-y-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1.5">Moyens de paiement autorisés</label>
                            <div className="flex gap-4">
                                <label className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethods.includes('BANK_TRANSFER') ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={paymentMethods.includes('BANK_TRANSFER')} 
                                        onChange={() => togglePaymentMethod('BANK_TRANSFER')} 
                                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 rounded cursor-pointer" 
                                    />
                                    <span className={`text-sm font-medium ${paymentMethods.includes('BANK_TRANSFER') ? 'text-indigo-900' : 'text-gray-900'}`}>Virement Bancaire</span>
                                </label>
                                <label className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${paymentMethods.includes('BANK_CHECK') ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={paymentMethods.includes('BANK_CHECK')} 
                                        onChange={() => togglePaymentMethod('BANK_CHECK')} 
                                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 rounded cursor-pointer" 
                                    />
                                    <span className={`text-sm font-medium ${paymentMethods.includes('BANK_CHECK') ? 'text-indigo-900' : 'text-gray-900'}`}>Chèque Bancaire</span>
                                </label>
                            </div>
                        </div>

                        <div className="max-w-xl">
                            <label className="block text-sm font-medium text-gray-900 mb-1.5">Condition de libération</label>
                            <select
                                {...register('paymentCondition')}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm cursor-pointer"
                            >
                                <option value="PREPAYMENT_100">100% Pré-Paiement</option>
                                <option value="DEPOSIT">Contrat à Dépôt (Crédit)</option>
                            </select>
                        </div>

                        {paymentCondition === 'DEPOSIT' && (
                            <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Montant du Dépôt</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('depositAmount')}
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium z-10 select-none">
                                            {watch('currency')}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Délai de Crédit</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register('creditDays')}
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-shadow shadow-sm pr-16"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium z-10 select-none">
                                            Jours
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </form>
    );
}
