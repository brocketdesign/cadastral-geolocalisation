# Alertes Foncier Pro — Feature Documentation

> **Last updated:** 2026-03-03  
> **Status:** UI Mockup Complete — Backend Not Implemented

---

## Overview

Real-time alert system for Caribbean real estate professionals. Monitors target zones for parcel listings, zoning changes, urban planning projects, and risk updates. Delivers notifications via SMS (Twilio), Email (Resend), and WebSocket (real-time UI).

---

## Architecture

```
Data Sources → AI Processing → Alert Decision Engine → Notification Delivery
(Perplexity,    (Claude 3.5,    (Match zones,         (Twilio SMS,
 Firecrawl,      GPT-4o)         calculate relevance,   Resend email,
 Géoportail)                     determine priority)    WebSocket)
```

---

## Implementation Status

### ✅ IMPLEMENTED (Frontend UI — Mock Data)

| Component | File | Status |
|-----------|------|--------|
| **TypeScript types** | `src/types/alerts.ts` | ✅ Complete |
| **Mock data** | `src/lib/mock-alerts.ts` | ✅ Complete |
| **AlertSettings page** | `src/pages/AlertSettings.tsx` | ✅ Complete |
| **Profile & Contact section** | `src/components/features/alerts/ProfileContactSection.tsx` | ✅ Complete |
| **Phone verification flow (OTP UI)** | (embedded in ProfileContactSection) | ✅ UI only |
| **Alert Zones section** | `src/components/features/alerts/AlertZonesSection.tsx` | ✅ Complete |
| **Zone creation dialog** | (embedded in AlertZonesSection) | ✅ Complete |
| **Alert Types section** | `src/components/features/alerts/AlertTypesSection.tsx` | ✅ Complete |
| **Notification Settings section** | `src/components/features/alerts/NotificationSettingsSection.tsx` | ✅ Complete |
| **Advanced Filters section** | `src/components/features/alerts/AdvancedFiltersSection.tsx` | ✅ Complete |
| **Activity & Usage section** | `src/components/features/alerts/ActivityUsageSection.tsx` | ✅ Complete |
| **Alert Inbox** | `src/components/features/alerts/AlertInbox.tsx` | ✅ Complete |
| **Routing** | `src/App.tsx` — route `/alerts` | ✅ Complete |
| **Sidebar navigation** | `src/components/layout/DashboardLayout.tsx` | ✅ Complete |
| **Tabs (Inbox / Config)** | Integrated in AlertSettings page | ✅ Complete |

### ❌ NOT IMPLEMENTED (Backend / Integrations)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Resend integration** | Email sending via Resend API | 🔴 High |
| **Resend email templates** | Rich HTML templates for alerts, digests | 🔴 High |
| **Twilio SMS integration** | SMS sending for urgent alerts | 🔴 High |
| **Twilio OTP verification** | Phone number verification via SMS code | 🔴 High |
| **MongoDB collections** | `users`, `alertConfigs`, `alertEvents` | 🔴 High |
| **API endpoints – Alert config CRUD** | `/api/alerts/config` | 🔴 High |
| **API endpoints – Alert events** | `/api/alerts/events` | 🔴 High |
| **API endpoints – Phone verify** | `/api/verify/send`, `/api/verify/check` | 🔴 High |
| **Perplexity Sonar Pro** | News, arrêtés, PLU changes, projects search | 🟡 Medium |
| **Firecrawl scraping** | Deep scraping of listings and commune sites | 🟡 Medium |
| **Géoportail API** | Parcel boundaries, cadastral data | 🟡 Medium |
| **Claude 3.5 Sonnet** | Document extraction, French legal text | 🟡 Medium |
| **GPT-4o** | Structured JSON output, alert formatting | 🟡 Medium |
| **Redis event queue** | Deduplicate, prioritize, route events | 🟡 Medium |
| **Alert Decision Engine** | Match user zones, calculate relevance | 🟡 Medium |
| **WebSocket / Socket.io** | Real-time push to dashboard | 🟡 Medium |
| **Digest email scheduler** | Daily/weekly digest via cron job | 🟡 Medium |
| **Leaflet map draw tools** | Polygon drawing for custom zone creation | 🟢 Low |
| **Radius zone map picker** | Click-to-place center point on map | 🟢 Low |
| **PostHog analytics** | Open rates, conversions, revenue tracking | 🟢 Low |
| **PDF report attachments** | Generate PDF for email alerts | 🟢 Low |
| **WhatsApp fallback** | Twilio WhatsApp if SMS fails | 🟢 Low |

---

## Data Models

### User Profile
```typescript
{
  id: string;
  email: string;          // Resend delivery target
  emailVerified: boolean;
  phone: string;          // Twilio delivery target (+596/+590 format)
  phoneVerified: boolean; // Twilio OTP verified
  fullName: string;
  agencyName?: string;
  territory: 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';
  timezone: string;       // Auto-detected (e.g., 'America/Guadeloupe')
}
```

### Alert Zone
```typescript
{
  id: string;
  userId: string;
  name: string;
  zoneType: 'commune' | 'polygon' | 'radius';
  communes?: string[];
  geometry?: GeoJSON.Polygon;
  center?: { lat: number; lng: number };
  radiusKm?: number;
  parcelReference?: string;
  isActive: boolean;
}
```

### Alert Event
```typescript
{
  id: string;
  alertConfigId: string;
  type: AlertTypeKey;     // NEW_LISTING, PLU_CHANGE, etc.
  priority: 'urgent' | 'standard' | 'low';
  title: string;
  summary: string;
  details: string;
  zoneName: string;
  commune: string;
  parcelRef?: string;
  channels: ('sms' | 'email' | 'websocket')[];
  read: boolean;
  emailSentAt?: string;   // Resend delivery tracking
  smsSentAt?: string;      // Twilio delivery tracking
}
```

---

## Alert Types

| Key | Label | Default | Urgent |
|-----|-------|---------|--------|
| `NEW_LISTING` | Nouvelles annonces | ON | No |
| `PRICE_DROP` | Baisses de prix | ON | No |
| `PLU_CHANGE` | Modifications PLU | ON | **Yes** |
| `NEW_ARRETE` | Nouveaux arrêtés | ON | **Yes** |
| `INFRASTRUCTURE` | Projets infrastructure | ON | No |
| `RISK_PPRI` | Alertes risques (PPRI) | ON | **Yes** |
| `OWNERSHIP_CHANGE` | Changements de propriété | OFF | No |
| `PUBLIC_SALE` | Ventes publiques | OFF | No |

---

## Notification Channels

| Channel | Provider | Use Case |
|---------|----------|----------|
| **SMS** | Twilio | Urgent alerts (zoning changes, risks) |
| **Email** | Resend | Standard alerts, daily digests, detailed reports |
| **WebSocket** | Socket.io | Real-time UI toasts, badge counters, sound alerts |

### Resend Email Strategy
- **Immediate alerts**: Rich HTML template with alert details + deep link to app
- **Daily digest**: Summary of all alerts from past 24h, sent at user's configured time
- **Weekly digest**: Weekly summary with charts and recommendations
- **Unsubscribe management**: Built-in Resend unsubscribe handling
- **PDF attachments**: Detailed risk/analysis reports attached to emails

### Twilio SMS Strategy
- **Local numbers**: +596 (Martinique), +590 (Guadeloupe) for best delivery
- **Delivery receipts**: Track SMS delivery status
- **Quiet hours**: No SMS between 22:00-07:00 (user configurable)
- **Fallback to WhatsApp**: If SMS delivery fails

---

## File Structure

```
src/
├── types/
│   └── alerts.ts                     # All TypeScript types for alerts
├── lib/
│   └── mock-alerts.ts                # Mock data for UI development
├── pages/
│   └── AlertSettings.tsx             # Main alert settings page (tabs: Inbox/Config)
└── components/features/alerts/
    ├── ProfileContactSection.tsx      # Section 1: Profile & phone verification
    ├── AlertZonesSection.tsx          # Section 2: Zone management + creation dialog
    ├── AlertTypesSection.tsx          # Section 3: Toggle alert types
    ├── NotificationSettingsSection.tsx # Section 4: SMS/Email/Sound preferences
    ├── AdvancedFiltersSection.tsx     # Section 5: Surface/Price/PLU filters
    ├── ActivityUsageSection.tsx       # Section 6: Stats & export
    └── AlertInbox.tsx                 # Alert inbox with search/filter/detail view
```

---

## Next Steps (Recommended Implementation Order)

1. **Set up Resend** — Add `RESEND_API_KEY` to `.env`, create `/api/alerts/send-email` endpoint
2. **Set up Twilio** — Add `TWILIO_*` env vars, create `/api/verify/send` and `/api/verify/check`
3. **MongoDB collections** — Create `alertConfigs` and `alertEvents` collections
4. **API CRUD endpoints** — `/api/alerts/config` (GET/POST/PUT/DELETE)
5. **Perplexity integration** — Scheduled search for news/PLU changes
6. **Alert Decision Engine** — Match events to user zones
7. **WebSocket integration** — Real-time push to connected clients
8. **Digest scheduler** — Cron job for daily/weekly email digests

---

## Environment Variables Needed

```env
# Resend (Email)
RESEND_API_KEY=re_xxxxx

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+596xxxxxxxxx

# Perplexity (AI Search)
PERPLEXITY_API_KEY=pplx-xxxxx

# Redis (Event Queue)
REDIS_URL=redis://localhost:6379

# Optional
FIRECRAWL_API_KEY=fc-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
