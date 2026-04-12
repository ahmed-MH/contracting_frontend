import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    X, Save, Building2, MapPin, Phone, User, Coins,
    Hash, Plus, Trash2, Mail, Landmark, Star,
    IdCard, CreditCard, Building, FileText
} from 'lucide-react';
import type { Hotel, CreateHotelPayload, HotelEmail } from '../types/hotel.types';
import { EMAIL_LABELS } from '../../../constants/emailLabels';
import { CURRENCIES } from '../../../constants/currencies';
import { useTranslation } from 'react-i18next';
import { createHotelSchema, type HotelFormInput, type HotelFormValues } from '../schemas/hotel.schema';

interface EditHotelModalProps {
    isOpen: boolean;
    onClose: () => void;
    editing: Hotel | null;
    onSubmit: (data: CreateHotelPayload) => void;
    isPending: boolean;
}

type FormValues = Omit<CreateHotelPayload, 'emails'> & { emails: HotelEmail[] };

const EMPTY_DEFAULTS: FormValues = {
    name: '', address: '', phone: '', fax: '', legalRepresentative: '',
    fiscalName: '', vatNumber: '', bankName: '', accountNumber: '',
    swiftCode: '', ibanCode: '', defaultCurrency: 'TND', logoUrl: '',
    stars: undefined, emails: [],
};

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-brand-slate/15 dark:bg-brand-slate/20" />
            <span className="text-[10px] font-black text-brand-slate uppercase tracking-widest shrink-0">{label}</span>
            <span className="h-px flex-1 bg-brand-slate/15 dark:bg-brand-slate/20" />
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="block text-[10px] font-black text-brand-slate uppercase tracking-widest mb-1.5">{children}</label>;
}

function InputWrapper({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/50">{icon}</span>}
            {children}
        </div>
    );
}

const inputCls = (hasIcon = true) =>
    `w-full ${hasIcon ? 'pl-9' : 'px-4'} pr-4 py-2.5 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm font-medium text-brand-navy dark:text-brand-light placeholder-brand-slate/40 focus:ring-2 focus:ring-brand-mint focus:border-brand-mint transition-all outline-none`;

export default function EditHotelModal({ isOpen, onClose, editing, onSubmit, isPending }: EditHotelModalProps) {
    const { t } = useTranslation('common');
    const schema = useMemo(() => createHotelSchema(t), [t]);
    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors, isDirty } } = useForm<HotelFormInput, unknown, HotelFormValues>({
        resolver: zodResolver(schema),
        defaultValues: EMPTY_DEFAULTS,
    });
    const { fields: emailFields, append: addEmail, remove: removeEmail } = useFieldArray({ control, name: 'emails' });

    useEffect(() => {
        if (editing) {
            reset({
                name: editing.name, address: editing.address, phone: editing.phone,
                fax: editing.fax || '', legalRepresentative: editing.legalRepresentative,
                fiscalName: editing.fiscalName || '', vatNumber: editing.vatNumber || '',
                bankName: editing.bankName || '', accountNumber: editing.accountNumber || '',
                swiftCode: editing.swiftCode || '', ibanCode: editing.ibanCode || '',
                defaultCurrency: editing.defaultCurrency, logoUrl: editing.logoUrl || '',
                stars: editing.stars, emails: editing.emails || [],
            });
        } else {
            reset(EMPTY_DEFAULTS);
        }
    }, [editing, reset, isOpen]);

    if (!isOpen) return null;

    const starsValue = watch('stars');
    const handleSwiftChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('swiftCode', e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 11));
    const handleVatChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('vatNumber', e.target.value.toUpperCase().replace(/\s/g, ''));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-brand-navy border border-transparent dark:border-brand-slate/20 rounded-2xl shadow-md w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-brand-slate/15 dark:border-brand-slate/20 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-brand-navy dark:text-brand-light flex items-center gap-2.5">
                            <span className="p-1.5 bg-brand-mint/10 dark:bg-brand-mint/5 rounded-xl">
                                <Building2 className="text-brand-mint" size={18} />
                            </span>
                            {editing ? `Modifier — ${editing.name}` : 'Nouvel Établissement'}
                        </h3>
                        <p className="text-[10px] font-bold text-brand-slate uppercase tracking-widest mt-0.5 ml-9">
                            fiche complète de l'établissement
                        </p>
                    </div>
                    <button type="button" onClick={onClose}
                        className="p-2 hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20 rounded-full text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer border-none outline-none">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit((data) => onSubmit(data))} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                        <SectionDivider label="Informations Générales" />
                        <div className="space-y-4">
                            <div>
                                <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.243e2040', { defaultValue: "Nom commercial de l'hôtel *" })}</FieldLabel>
                                <InputWrapper icon={<Building2 size={15} />}>
                                    <input {...register('name')} className={inputCls()} placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.38cb0167', { defaultValue: "Grand Hôtel Majestic" })} />
                                </InputWrapper>
                                {errors.name && <p className="mt-1 text-xs font-bold text-brand-slate">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.b8343faf', { defaultValue: "Représentant Légal *" })}</FieldLabel>
                                    <InputWrapper icon={<User size={15} />}>
                                        <input {...register('legalRepresentative')} className={inputCls()} placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.27c19c0c', { defaultValue: "Nom Prénom" })} />
                                    </InputWrapper>
                                    {errors.legalRepresentative && <p className="mt-1 text-xs font-bold text-brand-slate">{errors.legalRepresentative.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.2ca8c8ab', { defaultValue: "Devise (ISO 4217) *" })}</FieldLabel>
                                    <InputWrapper icon={<Coins size={15} />}>
                                        <select {...register('defaultCurrency')}
                                            className={`${inputCls()} font-bold font-mono tracking-widest cursor-pointer appearance-none`}>
                                            <option value="">{t('auto.features.hotel.components.edithotelmodal.79a4a688', { defaultValue: "— Devise —" })}</option>
                                            {CURRENCIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>
                                            ))}
                                        </select>
                                    </InputWrapper>
                                    {errors.defaultCurrency && <p className="mt-1 text-xs font-bold text-brand-slate">{errors.defaultCurrency.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.7d0c40d0', { defaultValue: "Adresse Complète *" })}</FieldLabel>
                                    <InputWrapper icon={<MapPin size={15} />}>
                                        <input {...register('address')} className={inputCls()} placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.0d9f6dde', { defaultValue: "Avenue Habib Bourguiba, 1001 Tunis" })} />
                                    </InputWrapper>
                                    {errors.address && <p className="mt-1 text-xs font-bold text-brand-slate">{errors.address.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.637932f7', { defaultValue: "Catégorie (Étoiles)" })}</FieldLabel>
                                    <div className="flex items-center gap-1.5 h-[42px] px-3 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button key={s} type="button"
                                                onClick={() => setValue('stars', starsValue === s ? undefined : s)}
                                                className={`transition-all cursor-pointer border-none outline-none p-0 ${(starsValue ?? 0) >= s ? 'text-brand-slate' : 'text-brand-slate/20'}`}>
                                                <Star size={16} fill={(starsValue ?? 0) >= s ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SectionDivider label="Contacts" />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.afc60cf6', { defaultValue: "Téléphone *" })}</FieldLabel>
                                    <InputWrapper icon={<Phone size={15} />}>
                                        <input {...register('phone')} className={inputCls()} placeholder="+216 71 000 000" />
                                    </InputWrapper>
                                    {errors.phone && <p className="mt-1 text-xs font-bold text-brand-slate">{errors.phone.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.b2db8638', { defaultValue: "Fax" })}</FieldLabel>
                                    <InputWrapper icon={<Phone size={15} className="opacity-50" />}>
                                        <input {...register('fax')} className={inputCls()} placeholder="+216 71 000 001" />
                                    </InputWrapper>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.6e775c60', { defaultValue: "Adresses Email" })}</FieldLabel>
                                    <button type="button" onClick={() => addEmail({ label: '', address: '' })}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-mint hover:text-brand-mint/80 transition-colors cursor-pointer border-none outline-none bg-transparent">
                                        <Plus size={13} /> Ajouter un email
                                    </button>
                                </div>

                                {emailFields.length === 0 ? (
                                    <div onClick={() => addEmail({ label: '', address: '' })}
                                        className="flex items-center gap-2 px-4 py-3 border border-dashed border-brand-slate/20 rounded-xl text-sm text-brand-slate cursor-pointer hover:border-brand-mint hover:text-brand-mint hover:bg-brand-mint/5 transition-all">
                                        <Mail size={15} />
                                        <span className="text-xs">{t('auto.features.hotel.components.edithotelmodal.3d3545d5', { defaultValue: "Cliquez pour ajouter une adresse email..." })}</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {emailFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <div className="w-36 shrink-0">
                                                    <select {...register(`emails.${index}.label`)}
                                                        className="w-full px-3 py-2 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-xs font-bold text-brand-navy dark:text-brand-light focus:ring-2 focus:ring-brand-mint transition-all outline-none cursor-pointer">
                                                        <option value="">{t('auto.features.hotel.components.edithotelmodal.703a8973', { defaultValue: "— Type —" })}</option>
                                                        {EMAIL_LABELS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/40" size={14} />
                                                    <input
                                                        {...register(`emails.${index}.address`)}
                                                        type="email"
                                                        className="w-full pl-9 pr-4 py-2 bg-brand-light dark:bg-brand-slate/10 border border-brand-slate/20 rounded-xl text-sm font-medium text-brand-navy dark:text-brand-light placeholder-brand-slate/40 focus:ring-2 focus:ring-brand-mint transition-all outline-none"
                                                        placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.8ac6dfd2', { defaultValue: "email@hotel.com" })}
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeEmail(index)}
                                                    className="p-2 text-brand-slate/40 hover:text-brand-slate hover:bg-brand-slate/10 dark:hover:bg-brand-navy/80 rounded-xl transition-colors cursor-pointer border-none outline-none bg-transparent shrink-0">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <SectionDivider label="Informations Fiscales & Bancaires" />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.607ae752', { defaultValue: "Raison Sociale (Nom Fiscal)" })}</FieldLabel>
                                    <InputWrapper icon={<FileText size={15} />}>
                                        <input {...register('fiscalName')} className={inputCls()} placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.1c4e4c18', { defaultValue: "SARL Grand Hôtel…" })} />
                                    </InputWrapper>
                                </div>
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.9f31c75d', { defaultValue: "Matricule Fiscal (VAT)" })}</FieldLabel>
                                    <InputWrapper icon={<IdCard size={15} />}>
                                        <input {...register('vatNumber')} onChange={handleVatChange}
                                            className={`${inputCls()} font-mono uppercase tracking-wider`}
                                            placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.cb2e3886', { defaultValue: "0123456A/P/M/000" })} />
                                    </InputWrapper>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.43648523', { defaultValue: "Nom de la Banque" })}</FieldLabel>
                                    <InputWrapper icon={<Building size={15} />}>
                                        <input {...register('bankName')} className={inputCls()} placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.a712cdab', { defaultValue: "BIAT, STB, Attijari…" })} />
                                    </InputWrapper>
                                </div>
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.55810cf8', { defaultValue: "Numéro de Compte (RIB)" })}</FieldLabel>
                                    <InputWrapper icon={<Hash size={15} />}>
                                        <input {...register('accountNumber')} className={`${inputCls()} font-mono`} placeholder="00 000 0000000000000 00" />
                                    </InputWrapper>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.5a2b4f15', { defaultValue: "Code SWIFT / BIC" })}</FieldLabel>
                                    <InputWrapper icon={<CreditCard size={15} />}>
                                        <input {...register('swiftCode')} onChange={handleSwiftChange}
                                            className={`${inputCls()} font-mono uppercase tracking-widest`}
                                            placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.5bc4d990', { defaultValue: "BIATTNTT" })} maxLength={11} />
                                    </InputWrapper>
                                </div>
                                <div>
                                    <FieldLabel>{t('auto.features.hotel.components.edithotelmodal.f56c06a7', { defaultValue: "Code IBAN" })}</FieldLabel>
                                    <InputWrapper icon={<Landmark size={15} />}>
                                        <input {...register('ibanCode')} className={`${inputCls()} font-mono uppercase`} placeholder={t('auto.features.hotel.components.edithotelmodal.placeholder.150788b3', { defaultValue: "TN59 …" })} />
                                    </InputWrapper>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-brand-light/60 dark:bg-brand-navy/60 border-t border-brand-slate/15 dark:border-brand-slate/20 shrink-0 flex items-center justify-between rounded-b-2xl">
                        <p className="text-[10px] text-brand-slate font-medium italic">{t('auto.features.hotel.components.edithotelmodal.dc2c01fd', { defaultValue: "* Champs obligatoires" })}</p>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={onClose}
                                className="px-5 py-2 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer border-none outline-none bg-transparent">
                                Annuler
                            </button>
                            <button type="submit" disabled={isPending || (!isDirty && editing !== null)}
                                className="inline-flex items-center gap-2 px-7 py-2.5 bg-brand-mint text-white text-sm font-bold rounded-xl hover:bg-brand-mint/90 active:scale-95 transition-all shadow-md shadow-brand-mint/20 disabled:opacity-50 disabled:grayscale cursor-pointer border-none outline-none">
                                {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                                {editing ? 'Enregistrer les modifications' : 'Créer l\'établissement'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
