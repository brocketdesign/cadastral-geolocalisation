/**
 * Email templates for CadaStreMap transactional emails.
 * All templates are inline-styled for maximum email client compatibility.
 */

export type EmailType = 'welcome' | 'trial-started' | 'account-locked';

export interface TemplateData {
  name?: string;
  email?: string;
  dashboardUrl?: string;
}

export interface EmailTemplate {
  subject: string;
  preheader: string;
  html: (data: TemplateData) => string;
  description: string;
}

const APP_URL = process.env.APP_URL || 'https://cadastremap.fr';

// ─── Base layout ─────────────────────────────────────────────────────────────

function layout(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CadaStreMap</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:28px 40px;border-radius:12px 12px 0 0;">
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                📍 Cada<span style="color:#34d399;">Stre</span>Map
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
              ${content}
              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
                <tr>
                  <td style="text-align:center;color:#94a3b8;font-size:12px;line-height:1.8;">
                    <p style="margin:0 0 4px;">© ${new Date().getFullYear()} CadaStreMap — Géolocalisation cadastrale</p>
                    <p style="margin:0;">
                      <a href="${APP_URL}" style="color:#34d399;text-decoration:none;">Accéder à la plateforme</a>
                      &nbsp;·&nbsp;
                      <a href="${APP_URL}/settings" style="color:#94a3b8;text-decoration:none;">Gérer mes préférences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Button helper ────────────────────────────────────────────────────────────

function btn(text: string, href: string, color = '#10b981'): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">${text}</a>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES: Record<EmailType, EmailTemplate> = {
  welcome: {
    subject: 'Bienvenue sur CadaStreMap 🗺️',
    preheader: 'Votre compte est prêt — commencez à explorer le cadastre français.',
    description: 'Envoyé dès la création du compte. Présente la plateforme et oriente l\'utilisateur.',
    html: ({ name = 'là', dashboardUrl = `${APP_URL}/dashboard` }) =>
      layout(
        `
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">
          Bienvenue sur CadaStreMap, ${name} ! 🎉
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
          Votre compte est créé et prêt à l'emploi. CadaStreMap vous permet de localiser n'importe quelle parcelle cadastrale en France, d'analyser les risques fonciers et de générer des rapports professionnels.
        </p>

        <!-- Feature highlights -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          ${[
            ['🔍', 'Recherche cadastrale', 'Localisez une parcelle par adresse, numéro de parcelle ou coordonnées GPS.'],
            ['📊', 'Risk Score IA', 'Évaluez le risque foncier d\'une parcelle grâce à notre analyse IA.'],
            ['📄', 'Rapports PDF', 'Générez des fiches parcellaires professionnelles pour vos clients.'],
            ['🔔', 'Alertes foncières', 'Soyez notifié en temps réel des changements sur vos parcelles surveillées.'],
          ]
            .map(
              ([icon, title, desc]) => `
          <tr>
            <td style="padding:10px 0;vertical-align:top;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:40px;font-size:20px;vertical-align:top;padding-top:2px;">${icon}</td>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0f172a;">${title}</p>
                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${desc}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`,
            )
            .join('')}
        </table>

        <div style="text-align:center;margin-bottom:32px;">
          ${btn('Accéder à mon tableau de bord →', dashboardUrl)}
        </div>

        <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
          Des questions ? Répondez simplement à cet e-mail, notre équipe vous répondra sous 24h.
        </p>
        `,
        'Votre compte est prêt — commencez à explorer le cadastre français.',
      ),
  },

  'trial-started': {
    subject: 'Votre essai gratuit commence — 3 jours pour tout explorer 🚀',
    preheader: 'Profitez de 3 jours d\'accès complet à CadaStreMap — aucune carte bancaire requise.',
    description: 'Envoyé lors de la création du compte. Rappelle les avantages de l\'essai gratuit de 3 jours.',
    html: ({ name = 'là', dashboardUrl = `${APP_URL}/dashboard` }) =>
      layout(
        `
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">
          Votre essai gratuit est activé, ${name} !
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
          Vous avez accès à l'ensemble des fonctionnalités CadaStreMap pendant <strong style="color:#0f172a;">3 jours</strong>. Aucune carte bancaire requise.
        </p>

        <!-- Trial countdown banner -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:10px;padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#065f46;text-transform:uppercase;letter-spacing:0.8px;">Votre essai</p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#047857;">3 jours d'accès complet</p>
              <p style="margin:6px 0 0;font-size:13px;color:#059669;">Toutes les fonctionnalités Pro débloquées — sans engagement.</p>
            </td>
          </tr>
        </table>

        <!-- What's included -->
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;">Ce qui est inclus dans votre essai :</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          ${[
            'Recherches cadastrales illimitées',
            'Export PDF des fiches parcellaires',
            'Risk Score IA sur toutes les parcelles',
            'Comparaison multi-parcelles',
            'Alertes foncières en temps réel',
            'Accès à l\'historique complet',
          ]
            .map(
              (item) => `
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#334155;">
              <span style="color:#10b981;font-weight:700;margin-right:8px;">✓</span>${item}
            </td>
          </tr>`,
            )
            .join('')}
        </table>

        <div style="text-align:center;margin-bottom:28px;">
          ${btn('Explorer CadaStreMap maintenant →', dashboardUrl)}
        </div>

        <!-- Upgrade CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Vous aimez CadaStreMap ? Passez en Pro avant la fin de l'essai.</p>
              <a href="${APP_URL}/pricing" style="font-size:13px;font-weight:600;color:#10b981;text-decoration:none;">Voir les offres →</a>
            </td>
          </tr>
        </table>
        `,
        'Profitez de 3 jours d\'accès complet à CadaStreMap — aucune carte bancaire requise.',
      ),
  },

  'account-locked': {
    subject: '⚠️ Votre compte CadaStreMap a été temporairement suspendu',
    preheader: 'Une action est requise pour réactiver votre accès à CadaStreMap.',
    description: 'Envoyé lorsque le compte est verrouillé ou suspendu (ex : trop de tentatives de connexion).',
    html: ({ name = 'là', email: _email = '' }) =>
      layout(
        `
        <!-- Alert banner -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 24px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#dc2626;">⚠️ Compte temporairement suspendu</p>
            </td>
          </tr>
        </table>

        <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">
          Bonjour ${name},
        </h1>
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Votre compte CadaStreMap a été temporairement suspendu suite à plusieurs tentatives de connexion incorrectes ou à une activité inhabituelle détectée sur votre compte.
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
          Pour des raisons de sécurité, l'accès à votre compte a été bloqué. <strong>Vous n'avez aucune action à entreprendre si vous êtes à l'origine de ces tentatives</strong> — votre compte sera automatiquement réactivé après un délai.
        </p>

        <!-- Steps -->
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;">Si ce n'était pas vous :</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          ${[
            ['1', 'Réinitialisez votre mot de passe dès que votre compte est réactivé.'],
            ['2', 'Vérifiez vos autres comptes utilisant le même mot de passe.'],
            ['3', 'Contactez notre support si vous avez besoin d\'aide.'],
          ]
            .map(
              ([num, text]) => `
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#334155;vertical-align:top;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;height:32px;background:#0f172a;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#fff;">${num}</td>
                  <td style="padding-left:12px;vertical-align:middle;">${text}</td>
                </tr>
              </table>
            </td>
          </tr>`,
            )
            .join('')}
        </table>

        <div style="text-align:center;margin-bottom:28px;">
          ${btn('Réinitialiser mon mot de passe', `${APP_URL}/sign-in`, '#dc2626')}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                💬 <strong>Besoin d'aide ?</strong> Répondez à cet e-mail ou contactez notre équipe à
                <a href="mailto:support@cadastremap.fr" style="color:#10b981;text-decoration:none;">support@cadastremap.fr</a>
              </p>
            </td>
          </tr>
        </table>
        `,
        'Une action est requise pour réactiver votre accès à CadaStreMap.',
      ),
  },
};
