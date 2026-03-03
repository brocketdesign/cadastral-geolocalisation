import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  MessageSquare,
  Mail,
  Clock,
  Download,
  ExternalLink,
} from 'lucide-react';
import type { AlertActivityStats } from '@/types/alerts';

interface ActivityUsageSectionProps {
  stats: AlertActivityStats;
  onViewHistory: () => void;
  onExportData: () => void;
}

export default function ActivityUsageSection({
  stats,
  onViewHistory,
  onExportData,
}: ActivityUsageSectionProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Aucune alerte';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (isToday) return `Aujourd'hui, ${time}`;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) + `, ${time}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Activité & Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Alertes ce mois */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {stats.alertsThisMonth}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Alertes ce mois
            </p>
          </div>

          {/* SMS envoyés */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
            <div className="flex items-center justify-center gap-1">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <p className="text-2xl font-bold text-blue-700">
                {stats.smsSent}
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-1">SMS envoyés</p>
          </div>

          {/* Emails envoyés */}
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-center">
            <div className="flex items-center justify-center gap-1">
              <Mail className="w-4 h-4 text-purple-500" />
              <p className="text-2xl font-bold text-purple-700">
                {stats.emailsSent}
              </p>
            </div>
            <p className="text-xs text-purple-600 mt-1">Emails envoyés</p>
          </div>

          {/* Dernière alerte */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {formatDate(stats.lastAlertAt)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Dernière alerte</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewHistory}
            className="gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir l&apos;historique des alertes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportData}
            className="gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter les données
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
