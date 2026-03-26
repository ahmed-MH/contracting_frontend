import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

interface LoginForm {
    email: string;
    password: string;
}

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginForm) => {
        setError('');
        setLoading(true);
        try {
            await login(data.email, data.password);
            navigate('/product/hotel', { replace: true });
        } catch {
            setError('Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-[#0F172A] font-sans">
            {/* Colonne Gauche - Image & Branding (cachée sur mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[#0F172A]/70 mix-blend-multiply z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/60 to-transparent z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                        alt="Luxury Hospitality" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-20 flex items-center gap-3">
                    <svg width="40" height="40" viewBox="0 0 100 100">
                        <line x1="30" y1="15" x2="30" y2="85" stroke="#F8FAFC" strokeWidth="16" strokeLinecap="round" />
                        <path d="M 30 25 L 55 25 C 80 25, 80 65, 55 65 L 30 65" fill="none" stroke="#10B981" strokeWidth="16" strokeLinecap="round" />
                    </svg>
                    <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">Pricify</span>
                </div>

                <div className="relative z-20 mb-8">
                    <h2 className="text-4xl xl:text-5xl font-extrabold text-[#F8FAFC] mb-6 tracking-tight leading-tight">
                        Contracting Hôtelier <br/> <span className="text-[#10B981]">Réinventé.</span>
                    </h2>
                    <p className="text-[#94A3B8] text-lg font-light max-w-md leading-relaxed">
                        Générez vos grilles tarifaires, gérez vos allotissements complexes et simulez vos prix avec l'outil le plus puissant du marché B2B.
                    </p>
                </div>
            </div>

            {/* Colonne Droite - Formulaire de Connexion */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
                {/* Logo visible uniquement sur mobile */}
                <div className="absolute top-8 left-8 flex items-center gap-3 lg:hidden">
                    <svg width="32" height="32" viewBox="0 0 100 100">
                        <line x1="30" y1="15" x2="30" y2="85" stroke="#F8FAFC" strokeWidth="16" strokeLinecap="round" />
                        <path d="M 30 25 L 55 25 C 80 25, 80 65, 55 65 L 30 65" fill="none" stroke="#10B981" strokeWidth="16" strokeLinecap="round" />
                    </svg>
                    <span className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Pricify</span>
                </div>

                <div className="w-full max-w-md mt-12 lg:mt-0">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Bienvenue</h1>
                        <p className="text-[#64748B] text-sm mt-2 font-light">
                            Connectez-vous à votre espace sécurisé
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-[12px] uppercase tracking-[2px] font-bold text-[#64748B] mb-3">Email professionnel</label>
                            <input
                                type="email"
                                {...register('email', { required: 'Veuillez saisir votre email' })}
                                placeholder="nom@hotel.com"
                                className="w-full px-4 py-4 bg-[#1E293B] border border-[#334155] rounded-[10px] text-[#F8FAFC] placeholder:text-[#64748B] text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all duration-300 shadow-sm"
                                autoComplete="email"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-2 font-medium">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[12px] uppercase tracking-[2px] font-bold text-[#64748B] mb-3">Mot de passe</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', { required: 'Veuillez saisir votre mot de passe' })}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-4 bg-[#1E293B] border border-[#334155] rounded-[10px] text-[#F8FAFC] placeholder:text-[#64748B] text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all duration-300 pr-12 shadow-sm"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors duration-300 cursor-pointer"
                                    aria-label="Afficher/Masquer le mot de passe"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-2 font-medium">{errors.password.message}</p>}
                            
                            <div className="flex justify-end mt-3">
                                <Link to="/forgot-password" className="text-sm text-[#10B981] hover:text-[#059669] transition-colors duration-300 font-medium">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-4 py-3 text-red-400 text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-[#10B981] text-white font-semibold rounded-[10px] hover:bg-[#059669] hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] shadow-[0_4px_14px_rgba(16,185,129,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#10B981] disabled:hover:shadow-[0_4px_14px_rgba(16,185,129,0.4)] cursor-pointer flex justify-center items-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connexion en cours...
                                </span>
                            ) : 'Se connecter'}
                        </button>
                    </form>
                    
                    <p className="text-center text-[#64748B] text-xs mt-12 font-light">
                        © {new Date().getFullYear()} Pricify Contracting System. Tous droits réservés.
                    </p>
                </div>
            </div>
        </div>
    );
}
