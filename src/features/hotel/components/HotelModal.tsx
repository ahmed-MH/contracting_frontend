import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    X, Save, Building2, MapPin, Phone, User, Coins,
    Hash, Plus, Trash2, Mail, Landmark, Star,
    IdCard, CreditCard, Building, FileText
} from 'lucide-react';
import type { Hotel, CreateHotelPayload, HotelEmail } from '../types/hotel.types';
import { EMAIL_LABELS } from '../../../constants/emailLabels';
import { CURRENCIES } from '../../../constants/currencies';

interface HotelModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: Hotel | null;
    onSubmit: (data: CreateHotelPayload) => void;
    isPending: boolean;
}

type FormValues = Omit<CreateHotelPayload, 'emails'> & {
    emails: HotelEmail[];
};

const EMPTY_DEFAULTS: FormValues = {
    name: '',
    address: '',
    phone: '',
    fax: '',
    legalRepresentative: '',
    fiscalName: '',
    vatNumber: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    ibanCode: '',
    defaultCurrency: 'TND',
    logoUrl: '',
    stars: undefined,
    emails: [],
};

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-gray-100"></span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">{label}</span>
            <span className="h-px flex-1 bg-gray-100"></span>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{children}</label>;
}

function InputWrapper({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">{icon}</span>}
            {children}
        </div>
    );
}

const inputCls = (hasIcon = true) =>
    `w-full ${hasIcon ? 'pl-9' : 'px-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none`;

export default function HotelModal({ isOpen, onClose, editing, onSubmit, isPending }: HotelModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<FormValues>({ defaultValues: EMPTY_DEFAULTS });

    const { fields: emailFields, append: addEmail, remove: removeEmail } = useFieldArray({
        control,
        name: 'emails',
    });

    useEffect(() => {
        if (editing) {
            reset({
                name: editing.name,
                address: editing.address,
                phone: editing.phone,
                fax: editing.fax || '',
                legalRepresentative: editing.legalRepresentative,
                fiscalName: editing.fiscalName || '',
                vatNumber: editing.vatNumber || '',
                bankName: editing.bankName || '',
                accountNumber: editing.accountNumber || '',
                swiftCode: editing.swiftCode || '',
                ibanCode: editing.ibanCode || '',
                defaultCurrency: editing.defaultCurrency,
                logoUrl: editing.logoUrl || '',
                stars: editing.stars,
                emails: editing.emails || [],
            });
        } else {
            reset(EMPTY_DEFAULTS);
        }
    }, [editing, reset, isOpen]);

    if (!isOpen) return null;

    const starsValue = watch('stars');



    const handleSwiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue('swiftCode', e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 11));
    };

    const handleVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue('vatNumber', e.target.value.toUpperCase().replace(/\s/g, ''));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">

                {/* ── Header ───────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                            <span className="p-1.5 bg-indigo-50 rounded-lg">
                                <Building2 className="text-indigo-600" size={18} />
                            </span>
                            {editing ? `Modifier — ${editing.name}` : 'Nouvel Établissement'}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 ml-9">
                            fiche complète de l'établissement
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Scrollable Form Body ─────────────────────────── */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                        {/* ─── SECTION 1 : Informations Générales ────── */}
                        <SectionDivider label="Informations Générales" />

                        <div className="space-y-4">
                            <div>
                                <FieldLabel>Nom commercial de l'hôtel *</FieldLabel>
                                <InputWrapper icon={<Building2 size={15} />}>
                                    <input
                                        {...register('name', { required: 'Champ requis' })}
                                        className={inputCls()}
                                        placeholder="Grand Hôtel Majestic"
                                    />
                                </InputWrapper>
                                {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Représentant Légal *</FieldLabel>
                                    <InputWrapper icon={<User size={15} />}>
                                        <input
                                            {...register('legalRepresentative', { required: 'Champ requis' })}
                                            className={inputCls()}
                                            placeholder="Nom Prénom"
                                        />
                                    </InputWrapper>
                                    {errors.legalRepresentative && <p className="mt-1 text-xs font-bold text-red-500">{errors.legalRepresentative.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel>Devise (ISO 4217) *</FieldLabel>
                                    <InputWrapper icon={<Coins size={15} />}>
                                        <select
                                            {...register('defaultCurrency', { required: 'Requis' })}
                                            className={`${inputCls()} font-bold font-mono tracking-widest cursor-pointer appearance-none bg-white`}
                                        >
                                            <option value="">— Devise —</option>
                                            {CURRENCIES.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.code} - {c.name} ({c.symbol})
                                                </option>
                                            ))}
                                        </select>
                                    </InputWrapper>
                                    {errors.defaultCurrency && <p className="mt-1 text-xs font-bold text-red-500">{errors.defaultCurrency.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <FieldLabel>Adresse Complète *</FieldLabel>
                                    <InputWrapper icon={<MapPin size={15} />}>
                                        <input
                                            {...register('address', { required: 'Champ requis' })}
                                            className={inputCls()}
                                            placeholder="Avenue Habib Bourguiba, 1001 Tunis"
                                        />
                                    </InputWrapper>
                                    {errors.address && <p className="mt-1 text-xs font-bold text-red-500">{errors.address.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel>Catégorie (Étoiles)</FieldLabel>
                                    <div className="flex items-center gap-1.5 h-[42px] px-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setValue('stars', starsValue === s ? undefined : s)}
                                                className={`transition-all cursor-pointer border-none outline-none p-0 ${(starsValue ?? 0) >= s ? 'text-amber-400' : 'text-gray-200'}`}
                                            >
                                                <Star size={16} fill={(starsValue ?? 0) >= s ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── SECTION 2 : Contacts ────────────────────── */}
                        <SectionDivider label="Contacts" />

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Téléphone *</FieldLabel>
                                    <InputWrapper icon={<Phone size={15} />}>
                                        <input
                                            {...register('phone', { required: 'Champ requis' })}
                                            className={inputCls()}
                                            placeholder="+216 71 000 000"
                                        />
                                    </InputWrapper>
                                    {errors.phone && <p className="mt-1 text-xs font-bold text-red-500">{errors.phone.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel>Fax</FieldLabel>
                                    <InputWrapper icon={<Phone size={15} className="opacity-50" />}>
                                        <input
                                            {...register('fax')}
                                            className={inputCls()}
                                            placeholder="+216 71 000 001"
                                        />
                                    </InputWrapper>
                                </div>
                            </div>

                            {/* ── Emails dynamiques ── */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <FieldLabel>Adresses Email</FieldLabel>
                                    <button
                                        type="button"
                                        onClick={() => addEmail({ label: '', address: '' })}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer border-none outline-none bg-transparent"
                                    >
                                        <Plus size={13} />
                                        Ajouter un email
                                    </button>
                                </div>

                                {emailFields.length === 0 ? (
                                    <div
                                        onClick={() => addEmail({ label: '', address: '' })}
                                        className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 cursor-pointer hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all"
                                    >
                                        <Mail size={15} />
                                        <span className="text-xs">Cliquez pour ajouter une adresse email...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {emailFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <div className="w-36 shrink-0">
                                                    <select
                                                        {...register(`emails.${index}.label`, { required: true })}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all outline-none cursor-pointer"
                                                    >
                                                        <option value="">— Type —</option>
                                                        {EMAIL_LABELS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                                    <input
                                                        {...register(`emails.${index}.address`, {
                                                            required: true,
                                                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' }
                                                        })}
                                                        type="email"
                                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-300 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all outline-none"
                                                        placeholder="email@hotel.com"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEmail(index)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none outline-none bg-transparent shrink-0"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── SECTION 3 : Fiscalité & Banque ─────────── */}
                        <SectionDivider label="Informations Fiscales & Bancaires" />

                        <div className="space-y-4">
                            {/* Légal */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Raison Sociale (Nom Fiscal)</FieldLabel>
                                    <InputWrapper icon={<FileText size={15} />}>
                                        <input
                                            {...register('fiscalName')}
                                            className={inputCls()}
                                            placeholder="SARL Grand Hôtel…"
                                        />
                                    </InputWrapper>
                                </div>
                                <div>
                                    <FieldLabel>Matricule Fiscal (VAT)</FieldLabel>
                                    <InputWrapper icon={<IdCard size={15} />}>
                                        <input
                                            {...register('vatNumber')}
                                            onChange={handleVatChange}
                                            className={`${inputCls()} font-mono uppercase tracking-wider`}
                                            placeholder="0123456A/P/M/000"
                                        />
                                    </InputWrapper>
                                </div>
                            </div>

                            {/* Banque */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Nom de la Banque</FieldLabel>
                                    <InputWrapper icon={<Building size={15} />}>
                                        <input
                                            {...register('bankName')}
                                            className={inputCls()}
                                            placeholder="BIAT, STB, Attijari…"
                                        />
                                    </InputWrapper>
                                </div>
                                <div>
                                    <FieldLabel>Numéro de Compte (RIB)</FieldLabel>
                                    <InputWrapper icon={<Hash size={15} />}>
                                        <input
                                            {...register('accountNumber')}
                                            className={`${inputCls()} font-mono`}
                                            placeholder="00 000 0000000000000 00"
                                        />
                                    </InputWrapper>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>Code SWIFT / BIC</FieldLabel>
                                    <InputWrapper icon={<CreditCard size={15} />}>
                                        <input
                                            {...register('swiftCode')}
                                            onChange={handleSwiftChange}
                                            className={`${inputCls()} font-mono uppercase tracking-widest`}
                                            placeholder="BIATTNTT"
                                            maxLength={11}
                                        />
                                    </InputWrapper>
                                </div>
                                <div>
                                    <FieldLabel>Code IBAN</FieldLabel>
                                    <InputWrapper icon={<Landmark size={15} />}>
                                        <input
                                            {...register('ibanCode')}
                                            className={`${inputCls()} font-mono uppercase`}
                                            placeholder="TN59 …"
                                        />
                                    </InputWrapper>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── Footer ───────────────────────────────────────── */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center justify-between rounded-b-2xl">
                        <p className="text-[10px] text-gray-400 font-medium italic">
                            * Champs obligatoires
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer border-none outline-none bg-transparent"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || (!isDirty && editing !== null)}
                                className="inline-flex items-center gap-2 px-7 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:grayscale cursor-pointer border-none outline-none"
                            >
                                {isPending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {editing ? 'Enregistrer les modifications' : 'Créer l\'établissement'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
