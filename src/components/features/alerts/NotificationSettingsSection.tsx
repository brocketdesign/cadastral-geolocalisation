import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Mail, Send, Volume2, VolumeX } from 'lucide-react';
import type {
  NotificationPreferences,
  SmsAlertMode,
  EmailAlertMode,
  DigestFrequency,
} from '@/types/alerts';

interface NotificationSettingsSectionProps {
  prefs: NotificationPreferences;
  onPrefsChange: (prefs: NotificationPreferences) => void;
  onTestSms: () => void;
  onTestEmail: () => void;
}

export default function NotificationSettingsSection({
  prefs,
  onPrefsChange,
  onTestSms,
  onTestEmail,
}: NotificationSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          Paramètres de notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Alertes SMS */}
        <div className="p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <Label className="font-medium">Alertes SMS (Twilio)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={prefs.smsAlerts}
                onValueChange={(v) =>
                  onPrefsChange({
                    ...prefs,
                    smsAlerts: v as SmsAlertMode,
                  })
                }
              >
                <SelectTrigger className="w-44 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Toujours activé</SelectItem>
                  <SelectItem value="urgent_only">URGENT uniquement</SelectItem>
                  <SelectItem value="off">Désactivé</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onTestSms}
                disabled={prefs.smsAlerts === 'off'}
              >
                <Send className="w-3 h-3 mr-1" />
                Test SMS
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Les SMS sont envoyés via Twilio aux numéros +596/+590. Coût facturé selon votre plan.
          </p>
        </div>

        {/* Alertes Email */}
        <div className="p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              <Label className="font-medium">Alertes Email (Resend)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={prefs.emailAlerts}
                onValueChange={(v) =>
                  onPrefsChange({
                    ...prefs,
                    emailAlerts: v as EmailAlertMode,
                  })
                }
              >
                <SelectTrigger className="w-44 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immédiat</SelectItem>
                  <SelectItem value="digest">Résumé (Digest)</SelectItem>
                  <SelectItem value="off">Désactivé</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onTestEmail}
                disabled={prefs.emailAlerts === 'off'}
              >
                <Send className="w-3 h-3 mr-1" />
                Test Email
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Les emails sont envoyés via Resend avec templates HTML riches, pièces jointes PDF et liens profonds vers l&apos;application.
          </p>
        </div>

        {/* Fréquence du digest */}
        {prefs.emailAlerts === 'digest' && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <Label className="font-medium text-sm">Fréquence du résumé</Label>
            <div className="flex items-center gap-2">
              <Select
                value={prefs.digestFrequency}
                onValueChange={(v) =>
                  onPrefsChange({
                    ...prefs,
                    digestFrequency: v as DigestFrequency,
                  })
                }
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="never">Jamais</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500">à</span>
              <Select
                value={prefs.digestTime}
                onValueChange={(v) =>
                  onPrefsChange({ ...prefs, digestTime: v })
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '18:00'].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Navigateur / Son */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <Label className="font-medium text-sm">Notifications navigateur</Label>
            <Switch
              checked={prefs.websocketToasts}
              onCheckedChange={(v) =>
                onPrefsChange({ ...prefs, websocketToasts: v })
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              {prefs.soundNotifications ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <Label className="font-medium text-sm">Son de notification</Label>
            </div>
            <Switch
              checked={prefs.soundNotifications}
              onCheckedChange={(v) =>
                onPrefsChange({ ...prefs, soundNotifications: v })
              }
            />
          </div>
        </div>

        {/* Heures calmes */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
          <div>
            <Label className="font-medium text-sm">Heures silencieuses</Label>
            <p className="text-xs text-slate-500">
              Pas de SMS pendant cette période
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={prefs.quietHoursStart}
              onValueChange={(v) =>
                onPrefsChange({ ...prefs, quietHoursStart: v })
              }
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['20:00', '21:00', '22:00', '23:00', '00:00'].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500">à</span>
            <Select
              value={prefs.quietHoursEnd}
              onValueChange={(v) =>
                onPrefsChange({ ...prefs, quietHoursEnd: v })
              }
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['05:00', '06:00', '07:00', '08:00', '09:00'].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
