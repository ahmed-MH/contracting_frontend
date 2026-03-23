import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, UtensilsCrossed, Hash, AlignLeft, BarChart3 } from 'lucide-react';
import type { Arrangement, CreateArrangementPayload } from '../types/arrangement.types';

interface ArrangementModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: Arrangement | null;
    onSubmit: (data: CreateArrangementPayload) => void;
    isPending: boolean;
}

export default function ArrangementModal({
    isOpen,
    onClose,
    editing,
    onSubmit,
    isPending
}: ArrangementModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<CreateArrangementPayload>({
        defaultValues: {
            code: '',
            name: '',
            description: '',
            level: 0,
        },
    });

    useEffect(() => {
        if (editing) {
            reset({
                code: editing.code,
                name: editing.name,
                description: editing.description || '',
                level: editing.level || 0,
            });
        } else {
            reset({
                code: '',
                name: '',
                description: '',
                level: 0,
            });
        }
    }, [editing, reset, isOpen]);

    if (!isOpen) return null;

    const toTitleCase = (str: string) =>
        str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <UtensilsCrossed className="text-indigo-600" size={20} />
                            {editing ? 'Modifier l\'Arrangement' : 'Nouvel Arrangement'}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Plan repas & board type</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-6">
                        {/* Section: Identité */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Code Unique</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            {...register('code', { required: 'Requis', maxLength: 5 })}
                                            onChange={(e) => setValue('code', e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 5))}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-black font-mono tracking-widest"
                                            placeholder="LPD"
                                            maxLength={5}
                                        />
                                    </div>
                                    {errors.code && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.code.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Niveau Escalier</label>
                                    <div className="relative">
                                        <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="number"
                                            {...register('level', { valueAsNumber: true, min: 0 })}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">0 = Base, 1+ = Supérieur</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Libellé</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    onBlur={(e) => setValue('name', toTitleCase(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="ex: Chambre Standard & Petit Déjeuner"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description / Inclusions</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3 top-3 text-gray-400" size={16} />
                                    <textarea
                                        {...register('description')}
                                        rows={3}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm resize-none"
                                        placeholder="Décrivez les repas inclus dans cette formule..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Note info */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700 shadow-sm animate-pulse-slow">
                            <UtensilsCrossed size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold leading-relaxed">Logique des niveaux</p>
                                <p className="text-[11px] mt-1 opacity-80 leading-relaxed uppercase tracking-tighter font-medium">
                                    Une pension est disponible en option si son niveau est supérieur à la pension de base du contrat.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer border-none outline-none bg-transparent">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || (!isDirty && editing !== null)}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer border-none outline-none"
                        >
                            {isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {editing ? 'Enregistrer les changements' : 'Créer l\'arrangement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
