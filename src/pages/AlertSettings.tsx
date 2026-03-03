import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Settings,
  Inbox,
} from 'lucide-react';
import UpgradeGate from '@/components/features/UpgradeGate';
import ProfileContactSection from '@/components/features/alerts/ProfileContactSection';
import AlertZonesSection from '@/components/features/alerts/AlertZonesSection';
import AlertTypesSection from '@/components/features/alerts/AlertTypesSection';
import NotificationSettingsSection from '@/components/features/alerts/NotificationSettingsSection';
import AdvancedFiltersSection from '@/components/features/alerts/AdvancedFiltersSection';
import ActivityUsageSection from '@/components/features/alerts/ActivityUsageSection';
import AlertInbox from '@/components/features/alerts/AlertInbox';
import type {
  AlertUserProfile,
  AlertZone,
  AlertTypeKey,
  NotificationPreferences,
  AdvancedFilters,
  AlertEvent,
} from '@/types/alerts';
import {
  MOCK_USER_PROFILE,
  MOCK_ALERT_ZONES,
  MOCK_ENABLED_ALERT_TYPES,
  MOCK_NOTIFICATION_PREFS,
  MOCK_ADVANCED_FILTERS,
  MOCK_ALERT_EVENTS,
  MOCK_ACTIVITY_STATS,
} from '@/lib/mock-alerts';

export default function AlertSettings() {
  // État avec données fictives
  const [profile, setProfile] = useState<AlertUserProfile>(MOCK_USER_PROFILE);
  const [zones, setZones] = useState<AlertZone[]>(MOCK_ALERT_ZONES);
  const [enabledAlertTypes, setEnabledAlertTypes] = useState<AlertTypeKey[]>(
    MOCK_ENABLED_ALERT_TYPES
  );
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    MOCK_NOTIFICATION_PREFS
  );
  const [filters, setFilters] = useState<AdvancedFilters>(
    MOCK_ADVANCED_FILTERS
  );
  const [events, setEvents] = useState<AlertEvent[]>(MOCK_ALERT_EVENTS);

  // Gestionnaires d'événements
  const handleTestAlert = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    toast.success(`Alerte test envoyée pour "${zone?.name}"`, {
      description: 'SMS et email de test envoyés avec succès.',
    });
  };

  const handleTestSms = () => {
    toast.success('SMS de test envoyé', {
      description: `SMS envoyé au ${profile.phone} via Twilio`,
    });
  };

  const handleTestEmail = () => {
    toast.success('Email de test envoyé', {
      description: `Email envoyé à ${profile.email} via Resend`,
    });
  };

  const handleMarkAsRead = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, read: true } : e))
    );
  };

  const handleMarkAllRead = () => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
    toast.info('Toutes les alertes marquées comme lues');
  };

  const handleViewHistory = () => {
    toast.info('Ouverture de l\'historique des alertes...');
  };

  const handleExportData = () => {
    toast.success('Export en cours...', {
      description: 'Le fichier CSV sera téléchargé dans quelques secondes.',
    });
  };

  return (
    <UpgradeGate
      requiredPlan="pro"
      featureLabel="Les Alertes Foncier Pro sont réservées au plan Pro. Passez au Pro pour recevoir des alertes en temps réel sur vos zones de prospection."
      blurContent
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Alertes Foncier Pro
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Recevez des alertes en temps réel par SMS, email et notifications
            push sur vos zones de prospection foncière.
          </p>
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="inbox" className="gap-1.5">
              <Inbox className="w-4 h-4" />
              Boîte de réception
              {events.filter((e) => !e.read).length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {events.filter((e) => !e.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Onglet Réception */}
          <TabsContent value="inbox" className="mt-4">
            <AlertInbox
              events={events}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllRead={handleMarkAllRead}
            />
          </TabsContent>

          {/* Onglet Configuration */}
          <TabsContent value="settings" className="mt-4 space-y-6">
            {/* 1. Profil & Contact */}
            <ProfileContactSection
              profile={profile}
              onProfileChange={setProfile}
            />

            {/* 2. Zones d'alerte */}
            <AlertZonesSection
              zones={zones}
              territory={profile.territory}
              onZonesChange={setZones}
              onTestAlert={handleTestAlert}
            />

            {/* 3. Types d'alertes */}
            <AlertTypesSection
              enabledTypes={enabledAlertTypes}
              onEnabledTypesChange={setEnabledAlertTypes}
            />

            {/* 4. Paramètres de notification */}
            <NotificationSettingsSection
              prefs={notifPrefs}
              onPrefsChange={setNotifPrefs}
              onTestSms={handleTestSms}
              onTestEmail={handleTestEmail}
            />

            {/* 5. Advanced Filters */}
            <AdvancedFiltersSection
              filters={filters}
              onFiltersChange={setFilters}
            />

            {/* 6. Activity & Usage */}
            <ActivityUsageSection
              stats={MOCK_ACTIVITY_STATS}
              onViewHistory={handleViewHistory}
              onExportData={handleExportData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </UpgradeGate>
  );
}
