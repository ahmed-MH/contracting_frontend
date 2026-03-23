import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../../../../components/ui/Modal';
import {
    type TemplateSpo,
    type CreateTemplateSpoPayload
} from '../types/spos.types';
import { useCreateSpoTemplate, useUpdateSpoTemplate } from '../hooks/useSpoTemplates';
import { FileText, Percent, Moon, Calendar, Wallet } from 'lucide-react';

interface SpoTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem?: TemplateSpo | null;
}

export default function SpoTemplateModal({ isOpen, onClose, editItem }: SpoTemplateModalProps) {
    const createMutation = useCreateSpoTemplate();
    const updateMutation = useUpdateSpoTemplate();
    const isEditing = !!editItem;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateTemplateSpoPayload>({
        defaultValues: {
            name: '',
            conditionType: 'NONE',
            benefitType: 'PERCENTAGE_DISCOUNT',
        }
    });

    const watchConditionType = watch('conditionType');
    const watchBenefitType = watch('benefitType');

    useEffect(() => {
        if (isOpen) {
            if (editItem) {
                reset({
                    name: editItem.name,
                    conditionType: editItem.conditionType,
                    conditionValue: editItem.conditionValue,
                    benefitType: editItem.benefitType,
                    benefitValue: editItem.benefitValue,
                });
            } else {
                reset({
                    name: '',
                    conditionType: 'NONE',
                    benefitType: 'PERCENTAGE_DISCOUNT',
                });
            }
        }
    }, [isOpen, editItem, reset]);

    const onSubmit = (data: CreateTemplateSpoPayload) => {
        // Clean up values if type doesn't need them
        const payload: CreateTemplateSpoPayload = { ...data };
        if (payload.conditionType === 'NONE' || payload.conditionType === 'HONEYMOONER') {
            delete payload.conditionValue;
        } else {
            payload.conditionValue = Number(payload.conditionValue);
        }

        if (['FREE_ROOM_UPGRADE', 'FREE_BOARD_UPGRADE', 'KIDS_GO_FREE'].includes(payload.benefitType)) {
            delete payload.benefitValue;
        } else {
            payload.benefitValue = Number(payload.benefitValue);
        }

        if (isEditing) {
            updateMutation.mutate(
                { id: editItem.id, payload },
                { onSuccess: onClose }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const conditionNeedsValue = ['MIN_NIGHTS', 'EARLY_BIRD', 'LONG_STAY'].includes(watchConditionType);
    const benefitNeedsValue = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_NIGHTS'].includes(watchBenefitType);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Modifier la condition spéciale (SPO)' : 'Créer une offre spéciale (SPO)'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Info de base */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" /> Nom de l'offre
                    </label>
                    <input
                        {...register('name', { required: 'Le nom est requis' })}
                        placeholder="Ex: Spring Promo -10%"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
                </div>

                {/* Règle Moteur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Colonne SI (Condition) */}
                    <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100/60 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                <span className="font-bold text-sm">SI</span>
                            </div>
                            <h3 className="font-semibold text-amber-900 text-sm uppercase tracking-wide">Condition</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-amber-800 mb-1">Type de condition</label>
                                <select
                                    {...register('conditionType', { required: true })}
                                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-800"
                                >
                                    <option value="NONE">Aucune (Toujours applicable)</option>
                                    <option value="MIN_NIGHTS">Nuits minimales (Min. Nights)</option>
                                    <option value="EARLY_BIRD">Réservation anticipée (Early Bird)</option>
                                    <option value="LONG_STAY">Long séjour (Long Stay)</option>
                                    <option value="HONEYMOONER">Voyage de noces (Honeymooner)</option>
                                </select>
                            </div>

                            {conditionNeedsValue && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-medium text-amber-800 mb-1">
                                        {watchConditionType === 'EARLY_BIRD' ? 'Jours à l\'avance' : 'Nombre de nuits'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register('conditionValue', { required: conditionNeedsValue ? 'Valeur requise' : false, min: 1 })}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-800 pl-9"
                                            placeholder="Ex: 3"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400">
                                            {watchConditionType === 'EARLY_BIRD' ? <Calendar size={16} /> : <Moon size={16} />}
                                        </div>
                                    </div>
                                    {errors.conditionValue && <p className="text-red-500 text-xs mt-1">{errors.conditionValue.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne ALORS (Avantage) */}
                    <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/60 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <span className="font-bold text-sm">ALORS</span>
                            </div>
                            <h3 className="font-semibold text-indigo-900 text-sm uppercase tracking-wide">Avantage</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-indigo-800 mb-1">Type d'avantage</label>
                                <select
                                    {...register('benefitType', { required: true })}
                                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800"
                                >
                                    <option value="PERCENTAGE_DISCOUNT">Réduction en pourcentage (%)</option>
                                    <option value="FIXED_DISCOUNT">Réduction fixe</option>
                                    <option value="FREE_NIGHTS">Nuits gratuites</option>
                                    <option value="FREE_ROOM_UPGRADE">Surclassement de chambre gratuit</option>
                                    <option value="FREE_BOARD_UPGRADE">Surclassement de pension gratuit</option>
                                    <option value="KIDS_GO_FREE">Enfants gratuits (Kids go free)</option>
                                </select>
                            </div>

                            {benefitNeedsValue && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-medium text-indigo-800 mb-1">
                                        {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? 'Pourcentage (%)' :
                                            watchBenefitType === 'FREE_NIGHTS' ? 'Nombre de nuits offertes' : 'Montant'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step={watchBenefitType === 'PERCENTAGE_DISCOUNT' ? "1" : "0.01"}
                                            {...register('benefitValue', { required: benefitNeedsValue ? 'Valeur requise' : false })}
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 pl-9"
                                            placeholder={watchBenefitType === 'PERCENTAGE_DISCOUNT' ? "Ex: 10" : "Ex: 1"}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                                            {watchBenefitType === 'PERCENTAGE_DISCOUNT' ? <Percent size={16} /> :
                                                watchBenefitType === 'FREE_NIGHTS' ? <Moon size={16} /> : <Wallet size={16} />}
                                        </div>
                                    </div>
                                    {errors.benefitValue && <p className="text-red-500 text-xs mt-1">{errors.benefitValue.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {isEditing ? 'Enregistrer les modifications' : 'Créer l\'offre'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
