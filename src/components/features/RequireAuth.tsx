/**
 * RequireAuth – protects a route, showing the Clerk sign-in modal when
 * the user is not authenticated.
 */

import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { clerkAppearance } from '@/lib/clerk-theme';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Connectez-vous à{' '}
                <span className="text-emerald-600">CadaStreMap</span>
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Accédez à la recherche cadastrale, l'historique et vos favoris.
              </p>
            </div>
            <SignIn
              appearance={clerkAppearance}
              routing="hash"
              fallbackRedirectUrl="/dashboard"
            />
          </div>
        </div>
      </SignedOut>
    </>
  );
}
