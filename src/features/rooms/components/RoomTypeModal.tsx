import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, BedDouble, Users, Baby, Hash, Settings2, User } from 'lucide-react';
import type { RoomType, CreateRoomTypePayload } from '../types/room.types';

interface RoomTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: RoomType | null;
    onSubmit: (data: CreateRoomTypePayload) => void;
    isPending: boolean;
}

export default function RoomTypeModal({
    isOpen,
    onClose,
    editing,
    onSubmit,
    isPending
}: RoomTypeModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<CreateRoomTypePayload>({
        defaultValues: {
            code: '',
            name: '',
            minOccupancy: 1,
            maxOccupancy: 3,
            minAdults: 1,
            maxAdults: 2,
            minChildren: 0,
            maxChildren: 2,
            allowCotOverMax: false,
        },
    });

    useEffect(() => {
        if (editing) {
            reset({
                code: editing.code,
                name: editing.name,
                minOccupancy: editing.minOccupancy,
                maxOccupancy: editing.maxOccupancy,
                minAdults: editing.minAdults,
                maxAdults: editing.maxAdults,
                minChildren: editing.minChildren,
                maxChildren: editing.maxChildren,
                allowCotOverMax: editing.allowCotOverMax,
            });
        } else {
            reset({
                code: '',
                name: '',
                minOccupancy: 1,
                maxOccupancy: 3,
                minAdults: 1,
                maxAdults: 2,
                minChildren: 0,
                maxChildren: 2,
                allowCotOverMax: false,
            });
        }
    }, [editing, reset, isOpen]);

    if (!isOpen) return null;

    const toTitleCase = (str: string) =>
        str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    const onFormSubmit = (data: any) => {
        const payload: CreateRoomTypePayload = {
            ...data,
            minOccupancy: Number(data.minOccupancy),
            maxOccupancy: Number(data.maxOccupancy),
            minAdults: Number(data.minAdults),
            maxAdults: Number(data.maxAdults),
            minChildren: Number(data.minChildren),
            maxChildren: Number(data.maxChildren),
        };
        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BedDouble className="text-indigo-600" size={20} />
                            {editing ? 'Modifier la Chambre' : 'Nouveau Type de Chambre'}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Configuration technique & capacité</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-8">
                        {/* Section: Identité */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Code PMS</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        {...register('code', { required: 'Requis', maxLength: 4 })}
                                        onChange={(e) => setValue('code', e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 4))}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-black font-mono tracking-widest"
                                        placeholder="DBL"
                                        maxLength={4}
                                    />
                                </div>
                                {errors.code && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.code.message}</p>}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom de la Chambre</label>
                                <input
                                    {...register('name', { required: 'Le nom est requis' })}
                                    onBlur={(e) => setValue('name', toTitleCase(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                                    placeholder="ex: Chambre Double Standard"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>
                        </div>

                        {/* Section: Capacités */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="h-px flex-1 bg-gray-100"></span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacités & Occupancy</span>
                                <span className="h-px flex-1 bg-gray-100"></span>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                {/* Total Occupancy */}
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-700 mb-2">
                                        <Users size={16} />
                                        <span className="text-xs font-bold uppercase tracking-tight">Total Pax</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min</label>
                                        <input type="number" {...register('minOccupancy')} className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max</label>
                                        <input type="number" {...register('maxOccupancy')} className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>

                                {/* Adults */}
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                        <User size={16} className="text-emerald-600" />
                                        <span className="text-xs font-bold uppercase tracking-tight">Adultes</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min</label>
                                        <input type="number" {...register('minAdults')} className="w-full bg-white border border-emerald-100 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max</label>
                                        <input type="number" {...register('maxAdults')} className="w-full bg-white border border-emerald-100 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
                                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                                        <Baby size={16} />
                                        <span className="text-xs font-bold uppercase tracking-tight">Enfants</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min</label>
                                        <input type="number" {...register('minChildren')} className="w-full bg-white border border-amber-100 rounded-lg px-3 py-1.5 text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max</label>
                                        <input type="number" {...register('maxChildren')} className="w-full bg-white border border-amber-100 rounded-lg px-3 py-1.5 text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Options */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
                                    <Settings2 size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Lit Bébé (Cot/Crib)</p>
                                    <p className="text-[11px] text-gray-500">Autoriser l'ajout d'un lit bébé au-delà de la capacité Max Pax.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    {...register('allowCotOverMax')} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
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
                            {editing ? 'Mettre à jour la chambre' : 'Créer la chambre'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
