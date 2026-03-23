import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Hotel, CheckCircle } from 'lucide-react';

interface ForgotForm {
    email: string;
}

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
        defaultValues: { email: '' },
    });

    const onSubmit = async (data: ForgotForm) => {
        setLoading(true);
        try {
            await authService.forgotPassword(data.email);
            setSent(true);
        } catch {
            // Still show success to prevent email enumeration
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/30">
                        <Hotel className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
                    <p className="text-amber-300 text-sm mt-1">Recevez un lien de réinitialisation</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center py-4">
                            <CheckCircle className="mx-auto text-emerald-400 mb-4" size={48} />
                            <p className="text-white font-medium mb-1">Email envoyé !</p>
                            <p className="text-indigo-300 text-sm mb-6">
                                Si cette adresse est enregistrée, un lien vous a été envoyé.
                            </p>
                            <Link to="/login"
                                className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                                ← Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    {...register('email', { required: 'Veuillez saisir votre email' })}
                                    placeholder="vous@exemple.com"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                    autoComplete="email"
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-600/30">
                                {loading ? 'Envoi...' : 'Envoyer le lien'}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                                    ← Retour à la connexion
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
