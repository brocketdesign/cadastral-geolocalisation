import type { Appearance } from '@clerk/clerk-react';

/**
 * Custom Clerk appearance to match the CadaStreMap emerald brand.
 * Applied globally via <ClerkProvider appearance={clerkAppearance}>.
 */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#059669',        // emerald-600
    colorText: '#0f172a',           // slate-900
    colorTextSecondary: '#64748b',  // slate-500
    colorBackground: '#ffffff',
    colorInputBackground: '#f8fafc', // slate-50
    colorInputText: '#0f172a',
    borderRadius: '0.625rem',       // matches --radius
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    card: 'shadow-xl border border-slate-200 rounded-xl',
    headerTitle: 'text-slate-900 font-bold text-xl',
    headerSubtitle: 'text-slate-500 text-sm',
    socialButtonsBlockButton:
      'border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg',
    socialButtonsBlockButtonText: 'text-slate-700 font-medium text-sm',
    formFieldLabel: 'text-slate-700 font-medium text-sm',
    formFieldInput:
      'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg',
    formButtonPrimary:
      'bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors',
    footerActionLink: 'text-emerald-600 hover:text-emerald-700 font-medium',
    identityPreviewEditButton: 'text-emerald-600 hover:text-emerald-700',
    formFieldAction: 'text-emerald-600 hover:text-emerald-700',
    logoImage: 'max-h-10',
    footer: 'hidden',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400 text-xs',
    otpCodeFieldInput: 'border-slate-200 focus:border-emerald-500',
    userButtonPopoverCard: 'shadow-xl border border-slate-200 rounded-xl',
    userButtonPopoverActionButton:
      'hover:bg-slate-50 text-slate-700 rounded-lg',
    userButtonPopoverActionButtonText: 'text-sm',
    userButtonPopoverFooter: 'hidden',
    userPreviewMainIdentifier: 'text-slate-900 font-semibold',
    userPreviewSecondaryIdentifier: 'text-slate-500 text-xs',
    avatarBox: 'ring-2 ring-emerald-500/20',
    badge: 'bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full',
    modalBackdrop: 'bg-black/40 backdrop-blur-sm',
    modalContent: 'rounded-xl shadow-2xl',
  },
};
