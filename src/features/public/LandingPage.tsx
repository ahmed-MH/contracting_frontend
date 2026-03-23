import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  // Styles
  const btnPrimary = "bg-[#10B981] text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-[#059669] hover:shadow-[0_8px_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0";
  const btnSecondary = "bg-[#1E293B] text-white font-semibold py-3 px-8 rounded-xl border border-[#334155] transition-all duration-200 hover:bg-[#334155]";
  const navLink = "text-[#64748B] hover:text-[#10B981] font-medium text-sm transition-colors";
  
  return (
    <div className="font-sans bg-[#F8FAFC] text-[#0F172A] antialiased scroll-smooth selection:bg-[#10B981] selection:text-white">
      
      {/* 1. Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" aria-label="Pricify Accueil">
            <div className="bg-[#0F172A] p-2 rounded-lg group-hover:scale-105 transition-transform">
              <svg width="24" height="24" viewBox="0 0 100 100">
                <line x1="30" y1="15" x2="30" y2="85" stroke="#F8FAFC" strokeWidth="16" strokeLinecap="round" />
                <path d="M 30 25 L 55 25 C 80 25, 80 65, 55 65 L 30 65" fill="none" stroke="#10B981" strokeWidth="16" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[#0F172A] text-2xl font-extrabold tracking-tight">ricify</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <a href="#solutions" className={navLink}>Solutions</a>
            <a href="#engine" className={navLink}>Moteur de règles</a>
            <a href="#benefits" className={navLink}>Avantages</a>
          </div>

          <div className="flex items-center gap-4">
             <Link to="/login" className="text-[#0F172A] font-semibold text-sm hover:text-[#10B981] transition-colors hidden md:block">
              Espace Client
            </Link>
            <Link to="/login" className="bg-[#0F172A] text-white text-sm font-semibold py-2.5 px-6 rounded-lg hover:bg-[#1E293B] transition-colors shadow-md">
              Connexion
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 2. Hero Section (Modern SaaS Split) */}
        <section className="bg-[#0F172A] pt-20 pb-32 px-6 relative overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#10B981]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#3B82F6]/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] mb-8">
                <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Plateforme B2B Nouvelle Génération</span>
              </div>
              
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                Le moteur de contracting qui <span className="text-[#10B981]">sécurise vos marges</span>.
              </h1>
              
              <p className="text-[#94A3B8] text-lg md:text-xl mb-10 font-light leading-relaxed">
                Fini les erreurs de calcul sur Excel. Pricify digitalise vos contrats Tour Opérateurs et arbitre automatiquement les cumuls (SPO, Early Booking) en temps réel.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className={btnPrimary}>
                  Planifier une démo
                </button>
                <Link to="/login" className={btnSecondary}>
                  Accéder au simulateur
                </Link>
              </div>
            </div>

            {/* Visual Technical Proof */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="bg-[#1E293B] rounded-2xl border border-[#334155] shadow-2xl overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center px-4 py-3 border-b border-[#334155] bg-[#0F172A]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto text-[#64748B] text-xs font-mono">simulation_engine.ts</div>
                </div>
                <div className="p-6 text-sm font-mono text-[#E2E8F0] overflow-x-auto">
                  <p className="text-[#94A3B8] mb-2">// Requête de simulation reçue</p>
                  <p><span className="text-[#3B82F6]">const</span> req = {'{'}</p>
                  <p className="pl-4">contractId: <span className="text-[#10B981]">'MARRIOTT_SMR_26'</span>,</p>
                  <p className="pl-4">pax: {'{'} adults: <span className="text-[#F59E0B]">2</span>, children: <span className="text-[#F59E0B]">1</span> {'}'},</p>
                  <p className="pl-4">room: <span className="text-[#10B981]">'SUP_SEA_VIEW'</span></p>
                  <p>{'}'};</p>
                  <br/>
                  <p className="text-[#94A3B8] mb-2">// Exécution de l'algorithme Anti-Cumul</p>
                  <p><span className="text-[#3B82F6]">await</span> <span className="text-yellow-200">PricingEngine</span>.<span className="text-blue-300">calculate</span>(req)</p>
                  <p className="pl-4 border-l-2 border-[#10B981]/50 ml-2 mt-2">
                    <span className="text-[#10B981]">✓</span> Base Rate (Double): 150.00 €<br/>
                    <span className="text-[#10B981]">✓</span> Reductions (Enfant -50%): -37.50 €<br/>
                    <span className="text-[#10B981]">✓</span> EB Rule Applied (-15%): -16.87 €<br/>
                    <span className="text-red-400">✗</span> SPO Stay&Pay (7=6): Blocked (No Cumul with EB)<br/>
                    <span className="text-blue-300">→ Final Net Price: 95.63 € / night</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. The Problem (Pain Points) */}
        <section id="benefits" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-[#0F172A] text-3xl md:text-4xl font-extrabold mb-6">Le contracting hôtelier ne devrait pas être un casse-tête</h2>
              <p className="text-[#64748B] text-lg">La gestion sur tableur engendre des fuites de revenus. Pricify structure vos données et automatise les règles métier complexes.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Erreurs de Cumuls</h3>
                <p className="text-[#64748B]">Fini les réductions non autorisées accordées par erreur parce que l'Early Booking s'est cumulé avec une offre spéciale (SPO).</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-orange-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Temps de Réponse</h3>
                <p className="text-[#64748B]">Ne laissez plus vos partenaires Tour Opérateurs attendre. Générez des cotations précises instantanément.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Complexité des contrats</h3>
                <p className="text-[#64748B]">Gérez facilement les tranches d'âges multiples, les suppléments galas obligatoires et les règles monoparentales.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Core Modules (Bento Grid) */}
        <section id="solutions" className="py-24 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <h2 className="text-[#0F172A] text-3xl md:text-5xl font-extrabold mb-16 tracking-tight">Une architecture taillée pour l'hôtellerie</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#0F172A] text-[#10B981] rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Gestion des Contrats & Saisons</h3>
                <p className="text-[#64748B] mb-6 max-w-xl">
                  Digitalisez la matrice de vos tarifs de base. Définissez vos périodes de validité (saisons haute, basse, épaule), attachez vos types de chambres et arrangements (LPD, DP, All-In), et générez vos grilles tarifaires structurées.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-[#F1F5F9] text-[#475569] px-3 py-1 rounded-full font-medium">Grilles Tarifaires</span>
                  <span className="text-xs bg-[#F1F5F9] text-[#475569] px-3 py-1 rounded-full font-medium">Arrangements</span>
                  <span className="text-xs bg-[#F1F5F9] text-[#475569] px-3 py-1 rounded-full font-medium">Release Dates</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-[#F0FDF4]">
                <div className="w-12 h-12 bg-[#10B981]/20 text-[#10B981] rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Moteur de Simulation</h3>
                <p className="text-[#64748B]">
                  Un calculateur ultra-rapide qui prend en compte l'âge des enfants, les suppléments et génère un prix net à la milliseconde pour vos partenaires.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-4">Special Offers & Early Bookings</h3>
                <p className="text-[#64748B] mb-6">
                  Configurez vos règles de réductions anticipées et vos promotions (Stay & Pay). Le moteur détecte la date de simulation et applique l'offre la plus avantageuse.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-4">Règles de Réduction Avancées</h3>
                <p className="text-[#64748B] mb-6">
                  Gestion fine de la logique Monoparentale (1 Adulte + Enfants), des réductions 3ème/4ème lit adulte, et des politiques d'annulation (J-X).
                </p>
              </div>

              {/* Card 5 */}
              <div className="bg-[#0F172A] text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10">
                  <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-2 relative z-10 text-[#10B981]">Algorithme Anti-Cumul</h3>
                <p className="text-[#94A3B8] text-sm relative z-10">
                  Garantissez vos revenus. Le système bloque mathématiquement le cumul d'offres incompatibles selon vos règles strictes.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 5. Pre-Footer CTA */}
        <section className="py-24 bg-white text-center px-6">
          <div className="container mx-auto max-w-4xl bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2rem] p-12 md:p-20 shadow-sm relative overflow-hidden">
             <div className="w-32 h-32 bg-[#10B981] absolute -top-10 -right-10 rounded-full blur-[80px] opacity-20"></div>
            
            <h2 className="text-[#0F172A] text-3xl md:text-5xl font-extrabold mb-8 tracking-tight">
              Prêt à reprendre le contrôle de votre <span className="text-[#10B981]">stratégie B2B</span> ?
            </h2>
            <p className="text-[#64748B] text-lg mb-10 max-w-2xl mx-auto">
              Rejoignez la plateforme conçue spécifiquement pour la complexité des contrats hôteliers et du yield management Tour Opérateur.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className={btnPrimary}>
                Se connecter à l'App
              </Link>
              <button className="bg-white text-[#0F172A] font-semibold py-3 px-8 rounded-xl border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors">
                Contacter le support
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="bg-[#0F172A] pt-20 pb-10 px-6 border-t border-[#334155]">
        <div className="container mx-auto grid md:grid-cols-4 gap-12 mb-16 items-start">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-[#10B981] p-1.5 rounded-md">
                 <svg width="20" height="20" viewBox="0 0 100 100">
                  <line x1="30" y1="15" x2="30" y2="85" stroke="#0F172A" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 30 25 L 55 25 C 80 25, 80 65, 55 65 L 30 65" fill="none" stroke="#0F172A" strokeWidth="16" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-white text-2xl font-extrabold tracking-tighter">ricify</span>
            </div>
            <p className="text-[#94A3B8] text-sm font-light max-w-sm leading-relaxed">
              Le premier moteur de pricing et de gestion de contrats conçu pour les groupes hôteliers traitant des volumes complexes B2B.
            </p>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Produit</h5>
            <ul className="space-y-4 text-[#94A3B8] text-sm font-medium">
              <li><a href="#" className="hover:text-[#10B981] transition-colors">Moteur de Simulation</a></li>
              <li><a href="#" className="hover:text-[#10B981] transition-colors">Gestionnaire de Contrats</a></li>
              <li><a href="#" className="hover:text-[#10B981] transition-colors">Sécurité & API</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Contact</h5>
            <p className="text-[#10B981] font-semibold mb-1">Ahmed Mhenni</p>
            <a href="tel:+21694565912" className="text-[#94A3B8] hover:text-white transition-colors text-sm font-medium block mb-4">+216 94 565 912</a>
          </div>
        </div>

        <div className="container mx-auto pt-8 border-t border-[#334155] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#64748B] text-xs font-semibold">
            &copy; {new Date().getFullYear()} Pricify SaaS. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm font-medium text-[#64748B]">
             <span>Architecturé avec NestJS & React.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;