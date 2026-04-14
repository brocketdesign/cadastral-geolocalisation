/**
 * TrialPaywallModal
 *
 * Shown once to free-plan users when they arrive on the Dashboard.
 * Offers a 3-day free trial of Pro (then 29€/month).
 *
 * Flow:
 *  1. Main offer dialog appears
 *  2. If user tries to close → exit-intent confirmation dialog
 *  3. If user confirms exit → popup permanently dismissed (localStorage)
 *  4. If user accepts trial → redirect to pricing / checkout
 *
 * localStorage keys:
 *   cadastral_trial_dismissed  — "true" when the user confirmed they don't want the offer
 *   cadastral_trial_accepted   — "true" when the user accepted the trial
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  CheckCircle2,
  X,
  Zap,
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { toast } from 'sonner';

const DISMISSED_KEY = 'cadastral_trial_dismissed';
const ACCEPTED_KEY = 'cadastral_trial_accepted';

function hasSeenOffer(): boolean {
  try {
    return (
      localStorage.getItem(DISMISSED_KEY) === 'true' ||
      localStorage.getItem(ACCEPTED_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, 'true');
  } catch {
    // ignore
  }
}

function markAccepted() {
  try {
    localStorage.setItem(ACCEPTED_KEY, 'true');
  } catch {
    // ignore
  }
}

/* ─────────────────────────────────────────────── */

export default function TrialPaywallModal() {
  const { plan, isLoaded } = useUserPlan();
  const { user } = useUser();

  const [mainOpen, setMainOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Open the paywall once Clerk is loaded and user is on free plan
  useEffect(() => {
    if (!isLoaded) return;
    if (plan !== 'free') return;
    if (hasSeenOffer()) return;

    // Small delay so the dashboard renders first
    const timer = setTimeout(() => setMainOpen(true), 800);
    return () => clearTimeout(timer);
  }, [isLoaded, plan]);

  /* ── Stripe checkout helper ─────────────────── */

  async function redirectToTrialCheckout() {
    if (!user) return;
    setLoading(true);

    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=pro&trial=true`;
      const cancelUrl = `${origin}/dashboard`;

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan: 'pro',
          trial: true,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Erreur lors de la création du checkout.');
      }

      markAccepted();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error('Impossible de démarrer le checkout. Veuillez réessayer.');
      setLoading(false);
    }
  }

  /* ── Handlers ────────────────────────────────── */

  const handleStartTrial = () => {
    setMainOpen(false);
    setExitOpen(false);
    redirectToTrialCheckout();
  };

  // User clicks X or backdrop on main modal → show exit confirmation
  const handleMainOpenChange = (open: boolean) => {
    if (!open && mainOpen) {
      setExitOpen(true);
      return;
    }
    setMainOpen(open);
  };

  const handleConfirmExit = () => {
    markDismissed();
    setExitOpen(false);
  };

  const handleBackToOffer = () => {
    setExitOpen(false);
    redirectToTrialCheckout();
  };

  const handleExitOpenChange = (open: boolean) => {
    if (!open) {
      // Backdrop click on exit dialog → treat as "go back to offer"
      handleBackToOffer();
    }
  };

  if (!isLoaded || plan !== 'free') return null;

  /* ── Render ──────────────────────────────────── */

  return (
    <>
      {/* ── MAIN OFFER DIALOG ─────────────────────────────────── */}
      <Dialog open={mainOpen} onOpenChange={handleMainOpenChange}>
        <DialogContent
          className="max-w-md p-0 flex flex-col border-0 shadow-2xl max-h-[90vh]"
          showCloseButton={false}
        >
          {/* Header gradient */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 pt-8 pb-10 text-white overflow-hidden shrink-0">
            {/* Background decoration */}
            <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-6 w-36 h-36 bg-white/10 rounded-full" />

            {/* Close button */}
            <button
              onClick={() => handleMainOpenChange(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Badge */}
            <div className="relative z-10 mb-3">
              <Badge className="bg-amber-400 text-amber-900 font-bold px-3 py-1 text-xs uppercase tracking-wider shadow-sm">
                <Zap className="w-3 h-3 mr-1 inline-block" />
                Offre exclusive · Une seule fois
              </Badge>
            </div>

            {/* Headline */}
            <div className="relative z-10 space-y-1">
              <DialogTitle className="text-3xl font-extrabold text-white leading-tight">
                3 jours d&apos;essai Pro
                <br />
                <span className="text-amber-300">100&nbsp;% gratuits</span>
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-sm mt-2 leading-relaxed">
                Profitez de toutes les fonctionnalités Pro sans engagement.
                <br />
                <span className="font-semibold text-white">
                  Cette offre est disponible uniquement ici et maintenant.
                </span>
              </DialogDescription>
            </div>

            {/* Price row */}
            <div className="relative z-10 flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-extrabold text-white">0&nbsp;€</span>
              <span className="text-emerald-200 text-sm">pendant 3 jours</span>
              <span className="text-emerald-200 text-sm">·</span>
              <span className="text-emerald-100 text-sm">puis 29&nbsp;€/mois</span>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="px-6 pt-5 pb-4 space-y-4 bg-white overflow-y-auto flex-1">
            {/* Pro features */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Inclus dans votre essai
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {[
                  'Recherches illimitées',
                  'Export PDF illimité',
                  'Historique complet',
                  'Parcelles favorites',
                  'Risk Score IA illimité',
                  'Comparaison foncière',
                ].map((text) => (
                  <li key={text} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning: limited offer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold">Offre unique :</span> si vous fermez ce message, vous
                ne pourrez plus accéder aux 3 jours d&apos;essai gratuits. Cette offre disparaît
                définitivement.
              </p>
            </div>
          </div>

          {/* Sticky CTA footer */}
          <div className="px-6 pb-5 pt-3 bg-white border-t border-slate-100 shrink-0 flex flex-col gap-2">
            <Button
              onClick={handleStartTrial}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base shadow-lg shadow-emerald-200"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Chargement…</>
              ) : (
                <><Crown className="w-5 h-5 mr-2" />Démarrer mon essai gratuit de 3 jours<ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
            <button
              onClick={() => handleMainOpenChange(false)}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 disabled:opacity-50"
            >
              Non merci, je préfère rester sur le plan limité
            </button>
            <p className="text-center text-xs text-slate-400">
              Carte requise · Aucun débit pendant 3 jours · Annulation à tout moment
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EXIT INTENT DIALOG ────────────────────────────────── */}
      <Dialog open={exitOpen} onOpenChange={handleExitOpenChange}>
        <DialogContent className="max-w-md p-0 flex flex-col border-0 shadow-2xl max-h-[90vh]" showCloseButton={false}>
          {/* Top danger stripe */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 pt-6 pb-8 text-white relative overflow-hidden shrink-0">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="relative z-10 flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-white leading-tight">
                  Dernière opportunité.
                </DialogTitle>
                <DialogDescription className="text-red-100 text-xs mt-0.5">
                  Si vous fermez ce message, vous ne pourrez plus accéder à la plateforme gratuitement.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-5 pb-6 space-y-4 bg-white overflow-y-auto flex-1">
            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Without Pro */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="font-bold text-red-700 text-center text-sm mb-2">
                  Sans Pro
                </p>
                {[
                  '1 seule recherche / jour',
                  '1 seul rapport risque / jour',
                  'Pas d\'historique',
                  'Pas de favoris',
                  'Pas de comparaison',
                  'Pas d\'export PDF',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-1.5 text-red-600">
                    <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* With Pro trial */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 space-y-2">
                <p className="font-bold text-emerald-700 text-center text-sm mb-2">
                  Essai Pro — 0&nbsp;€
                </p>
                {[
                  'Recherches illimitées',
                  'Rapports illimités',
                  'Historique complet',
                  'Favoris illimités',
                  'Comparaison foncière',
                  'Export PDF',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last chance notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-xs text-orange-800 leading-relaxed text-center">
              <span className="font-bold">Attention :</span> si vous confirmez la fermeture,
              cette offre d&apos;essai gratuit de 3 jours ne vous sera
              <span className="font-bold"> plus jamais proposée.</span>
              <br />
              Nous vous invitons à en profiter dès maintenant.
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={handleBackToOffer}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Chargement…</>
                ) : (
                  <><Crown className="w-4 h-4 mr-2" />Accepter l&apos;offre — 3 jours gratuits</>
                )}
              </Button>
              <button
                onClick={handleConfirmExit}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 disabled:opacity-50"
              >
                Non merci, je décline cette offre et accepte les limitations
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
