import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Hotel, Eye, EyeOff } from 'lucide-react';

interface AcceptForm {
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
}

export default function AcceptInvitePage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();
    const { loginWithResponse } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<AcceptForm>({
        defaultValues: { firstName: '', lastName: '', password: '', confirmPassword: '' },
    });

    const passwordValue = watch('password');

    const onSubmit = async (data: AcceptForm) => {
        if (!token) {
            setError('Token d\'invitation manquant. Vérifiez votre lien.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await authService.acceptInvite({
                token,
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
            });
            loginWithResponse(response);
            navigate('/product/hotel', { replace: true });
        } catch {
            setError('Token invalide ou expiré. Contactez votre administrateur.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center max-w-md">
                    <p className="text-red-300 mb-4">Aucun token d'invitation trouvé dans l'URL.</p>
                    <Link to="/login" className="text-indigo-300 hover:text-indigo-200 text-sm">
                        ← Retour à la connexion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
                        <Hotel className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Activez votre compte</h1>
                    <p className="text-emerald-300 text-sm mt-1">Complétez votre profil pour commencer</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Prénom</label>
                                <input
                                    {...register('firstName', { required: 'Requis' })}
                                    placeholder="Jean"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Nom</label>
                                <input
                                    {...register('lastName', { required: 'Requis' })}
                                    placeholder="Dupont"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-1.5">Mot de passe</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                        required: 'Requis',
                                        minLength: { value: 6, message: 'Min. 6 caractères' },
                                    })}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-12"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 cursor-pointer">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-1.5">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                {...register('confirmPassword', {
                                    required: 'Requis',
                                    validate: (val) => val === passwordValue || 'Les mots de passe ne correspondent pas',
                                })}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/30">
                            {loading ? 'Activation...' : 'Activer mon compte'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
