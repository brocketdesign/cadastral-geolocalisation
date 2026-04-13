/**
 * CheckoutSuccess
 *
 * Landing page after a successful Stripe Checkout.
 * URL: /checkout/success?session_id=xxx&plan=pro&trial=true
 *
 * 1. Reads session_id + userId from URL params.
 * 2. Calls /api/stripe/verify-session to confirm payment and upgrade the user in DB.
 * 3. Shows success / error state.
 * 4. Redirects to /dashboard after a short delay.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { CheckCircle2, Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Status = 'loading' | 'success' | 'error';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoaded: clerkLoaded } = useUser();

  const [status, setStatus] = useState<Status>('loading');
  const [isTrial, setIsTrial] = useState(false);

  useEffect(() => {
    if (!clerkLoaded) return;

    const sessionId = searchParams.get('session_id');
    const trial = searchParams.get('trial') === 'true';
    setIsTrial(trial);

    if (!sessionId) {
      setStatus('error');
      return;
    }

    if (!user) {
      // Not logged in — redirect to dashboard (Clerk will catch it)
      navigate('/dashboard');
      return;
    }

    fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((data: { plan?: string; status?: string; error?: string }) => {
        if (data.error) throw new Error(data.error);
        if (data.plan === 'pro') {
          setStatus('success');
          // Redirect to dashboard after 4 seconds
          setTimeout(() => navigate('/dashboard'), 4000);
        } else {
          setStatus('error');
        }
      })
      .catch((err) => {
        console.error('CheckoutSuccess verify error:', err);
        setStatus('error');
      });
  }, [clerkLoaded, user, searchParams, navigate]);

  /* ── Render ── */

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-600 text-lg">Vérification de votre paiement…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Une erreur est survenue</h1>
          <p className="text-slate-600 text-sm">
            Nous n&apos;avons pas pu confirmer votre paiement. Si vous avez été débité, contactez notre support.
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline">Retour au Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-white gap-6 px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-2">
        <MapPin className="w-7 h-7 text-emerald-600" />
        <span className="text-xl font-bold text-slate-900">
          Cada<span className="text-emerald-600">Stre</span>Map
        </span>
      </Link>

      {/* Checkmark */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      {/* Copy */}
      <div className="text-center max-w-md">
        {isTrial ? (
          <>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
              Votre essai de 3 jours commence&nbsp;!
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Bienvenue dans le plan <span className="font-bold text-emerald-700">Pro</span>.
              Profitez de toutes les fonctionnalités pendant 3 jours gratuits.
              Votre abonnement à 29&nbsp;€/mois démarrera automatiquement à la fin de la période d&apos;essai.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
              Abonnement Pro activé&nbsp;!
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Bienvenue dans le plan <span className="font-bold text-emerald-700">Pro</span>.
              Profitez de toutes les fonctionnalités sans limitation.
            </p>
          </>
        )}
      </div>

      {/* Redirect note */}
      <p className="text-sm text-slate-400">Redirection automatique vers le dashboard dans quelques secondes…</p>

      <Link to="/dashboard">
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          Aller au Dashboard maintenant
        </Button>
      </Link>
    </div>
  );
}
