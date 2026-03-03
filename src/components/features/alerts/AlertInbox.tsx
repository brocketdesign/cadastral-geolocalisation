import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bell,
  BellRing,
  Search,
  Filter,
  Mail,
  MessageSquare,
  Wifi,
  CheckCircle2,
  TrendingDown,
  FileText,
  Construction,
  ShieldAlert,
  Home,
  Gavel,
} from 'lucide-react';
import type { AlertEvent, AlertTypeKey, AlertPriority } from '@/types/alerts';

interface AlertInboxProps {
  events: AlertEvent[];
  onMarkAsRead: (eventId: string) => void;
  onMarkAllRead: () => void;
}

const TYPE_ICONS: Record<AlertTypeKey, React.ReactNode> = {
  NEW_LISTING: <Home className="w-4 h-4" />,
  PRICE_DROP: <TrendingDown className="w-4 h-4" />,
  PLU_CHANGE: <FileText className="w-4 h-4" />,
  NEW_ARRETE: <FileText className="w-4 h-4" />,
  INFRASTRUCTURE: <Construction className="w-4 h-4" />,
  RISK_PPRI: <ShieldAlert className="w-4 h-4" />,
  OWNERSHIP_CHANGE: <Home className="w-4 h-4" />,
  PUBLIC_SALE: <Gavel className="w-4 h-4" />,
};

const TYPE_COLORS: Record<AlertTypeKey, string> = {
  NEW_LISTING: 'bg-emerald-100 text-emerald-700',
  PRICE_DROP: 'bg-amber-100 text-amber-700',
  PLU_CHANGE: 'bg-blue-100 text-blue-700',
  NEW_ARRETE: 'bg-purple-100 text-purple-700',
  INFRASTRUCTURE: 'bg-orange-100 text-orange-700',
  RISK_PPRI: 'bg-red-100 text-red-700',
  OWNERSHIP_CHANGE: 'bg-slate-100 text-slate-700',
  PUBLIC_SALE: 'bg-cyan-100 text-cyan-700',
};

const TYPE_LABELS: Record<AlertTypeKey, string> = {
  NEW_LISTING: 'Nouvelle annonce',
  PRICE_DROP: 'Baisse de prix',
  PLU_CHANGE: 'Modification PLU',
  NEW_ARRETE: 'Nouvel arrêté',
  INFRASTRUCTURE: 'Infrastructure',
  RISK_PPRI: 'Risque PPRI',
  OWNERSHIP_CHANGE: 'Changement propriété',
  PUBLIC_SALE: 'Vente publique',
};

const PRIORITY_COLORS: Record<AlertPriority, string> = {
  urgent: 'bg-red-500 text-white',
  standard: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  websocket: <Wifi className="w-3 h-3" />,
};

export default function AlertInbox({
  events,
  onMarkAsRead,
  onMarkAllRead,
}: AlertInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AlertEvent | null>(null);

  const unreadCount = events.filter((e) => !e.read).length;

  const filteredEvents = events.filter((event) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !event.title.toLowerCase().includes(query) &&
        !event.summary.toLowerCase().includes(query) &&
        !event.zoneName.toLowerCase().includes(query) &&
        !event.commune.toLowerCase().includes(query)
      )
        return false;
    }
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (filterPriority !== 'all' && event.priority !== filterPriority)
      return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="w-5 h-5 text-emerald-600" />
            Boîte de réception des alertes
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs ml-2">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllRead}
              className="text-xs"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les alertes..."
                className="pl-9 h-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44 h-9">
                <Filter className="w-3.5 h-3.5 mr-1" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des événements */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Aucune alerte trouvée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    if (!event.read) onMarkAsRead(event.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
                    event.read
                      ? 'border-slate-200 bg-white'
                      : 'border-emerald-200 bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[event.type]}`}
                    >
                      {TYPE_ICONS[event.type]}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!event.read && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        <h4
                          className={`text-sm truncate ${
                            event.read
                              ? 'font-medium text-slate-700'
                              : 'font-semibold text-slate-900'
                          }`}
                        >
                          {event.title}
                        </h4>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 shrink-0 ${PRIORITY_COLORS[event.priority]}`}
                        >
                          {event.priority === 'urgent' ? '🔴 URGENT' : event.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {event.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {event.zoneName}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {event.commune}
                        </span>
                        <div className="flex items-center gap-1">
                          {event.channels.map((ch) => (
                            <span
                              key={ch}
                              className="text-slate-400"
                              title={ch.toUpperCase()}
                            >
                              {CHANNEL_ICONS[ch]}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de détail */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        {selectedEvent && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_COLORS[selectedEvent.type]}`}
                >
                  {TYPE_ICONS[selectedEvent.type]}
                </div>
                <Badge
                  className={`text-xs ${PRIORITY_COLORS[selectedEvent.priority]}`}
                >
                  {selectedEvent.priority === 'urgent'
                    ? '🔴 URGENT'
                    : selectedEvent.priority}
                </Badge>
              </div>
              <DialogTitle className="text-lg">
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedEvent.zoneName}</Badge>
                <Badge variant="outline">{selectedEvent.commune}</Badge>
                {selectedEvent.parcelRef && (
                  <Badge variant="outline">
                    Parcelle : {selectedEvent.parcelRef}
                  </Badge>
                )}
                <Badge variant="outline">
                  {TYPE_LABELS[selectedEvent.type]}
                </Badge>
              </div>

              <p className="text-sm font-medium text-slate-700">
                {selectedEvent.summary}
              </p>

              <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                {selectedEvent.details}
              </div>

              {/* Info de livraison */}
              <div className="border-t pt-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Canaux de notification
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.channels.map((ch) => (
                    <Badge key={ch} variant="outline" className="gap-1 text-xs">
                      {CHANNEL_ICONS[ch]}
                      {ch === 'sms' && 'SMS'}
                      {ch === 'email' && 'Email (Resend)'}
                      {ch === 'websocket' && 'Temps réel'}
                    </Badge>
                  ))}
                </div>
                {selectedEvent.emailSentAt && (
                  <p className="text-xs text-slate-400">
                    📧 Email envoyé le{' '}
                    {new Date(selectedEvent.emailSentAt).toLocaleString('fr-FR')}
                  </p>
                )}
                {selectedEvent.smsSentAt && (
                  <p className="text-xs text-slate-400">
                    📱 SMS envoyé le{' '}
                    {new Date(selectedEvent.smsSentAt).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Reçue le{' '}
                {new Date(selectedEvent.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
