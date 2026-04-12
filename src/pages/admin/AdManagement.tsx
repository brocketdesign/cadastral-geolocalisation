import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Megaphone, ShieldAlert, RefreshCw, Image, Type, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface AdRecord {
  id: string;
  type: 'text' | 'image';
  enabled: boolean;
  // text ad fields
  icon?: string;
  title?: string;
  description?: string;
  cta?: string;
  color?: string;
  link?: string;
  // image ad fields
  src?: string;
  alt?: string;
  href?: string;
  format?: 'sidebar' | 'banner' | 'inline';
}

const FORMAT_LABELS: Record<string, string> = {
  sidebar: 'Sidebar (3:4)',
  banner: 'Bannière (2:1)',
  inline: 'Inline (16:9)',
};

function TextAdRow({
  ad,
  onSave,
  saving,
}: {
  ad: AdRecord;
  onSave: (ad: AdRecord) => Promise<void>;
  saving: boolean;
}) {
  const [local, setLocal] = useState<AdRecord>(ad);
  const [expanded, setExpanded] = useState(false);
  const isDirty = JSON.stringify(local) !== JSON.stringify(ad);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          <Switch
            checked={local.enabled}
            onCheckedChange={(val) => setLocal((p) => ({ ...p, enabled: val }))}
          />
          <Type className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{local.title}</p>
            <p className="text-xs text-slate-500 truncate">{local.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <Badge className={`text-[10px] border-0 ${local.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {local.enabled ? 'Actif' : 'Désactivé'}
          </Badge>
          {isDirty && (
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={saving}
              onClick={() => onSave(local)}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sauvegarder'}
            </Button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Titre</Label>
            <Input
              value={local.title ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, title: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bouton (CTA)</Label>
            <Input
              value={local.cta ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, cta: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Description</Label>
            <Input
              value={local.description ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, description: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lien</Label>
            <Input
              value={local.link ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, link: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Couleur</Label>
            <Input
              value={local.color ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, color: e.target.value }))}
              className="h-8 text-sm"
              placeholder="emerald | violet | blue | amber | rose"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              disabled={saving || !isDirty}
              onClick={() => onSave(local)}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Sauvegarder les modifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageAdRow({
  ad,
  onSave,
  saving,
}: {
  ad: AdRecord;
  onSave: (ad: AdRecord) => Promise<void>;
  saving: boolean;
}) {
  const [local, setLocal] = useState<AdRecord>(ad);
  const [expanded, setExpanded] = useState(false);
  const isDirty = JSON.stringify(local) !== JSON.stringify(ad);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          <Switch
            checked={local.enabled}
            onCheckedChange={(val) => setLocal((p) => ({ ...p, enabled: val }))}
          />
          <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 shrink-0">
            <img src={local.src} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{local.alt}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge className="text-[10px] border-0 bg-slate-100 text-slate-600">
                {FORMAT_LABELS[local.format ?? ''] ?? local.format}
              </Badge>
              {local.href && local.href !== '#' && (
                <a href={local.href} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <Badge className={`text-[10px] border-0 ${local.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {local.enabled ? 'Actif' : 'Désactivé'}
          </Badge>
          {isDirty && (
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={saving}
              onClick={() => onSave(local)}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sauvegarder'}
            </Button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Texte alternatif (alt)</Label>
            <Input
              value={local.alt ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, alt: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">URL de destination (href)</Label>
            <Input
              value={local.href ?? ''}
              onChange={(e) => setLocal((p) => ({ ...p, href: e.target.value }))}
              className="h-8 text-sm"
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              disabled={saving || !isDirty}
              onClick={() => onSave(local)}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Sauvegarder les modifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdManagement() {
  const { user } = useUser();
  const { isAdmin } = useUserPlan();
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const adminUserId = user?.id;

  const fetchAds = useCallback(async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads?adminUserId=${adminUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAds(data.ads);
    } catch (err: unknown) {
      toast.error('Erreur lors du chargement des publicités', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  }, [adminUserId]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleSave = async (ad: AdRecord) => {
    if (!adminUserId) return;
    setSavingId(ad.id);
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId, ad }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? ad : a)));
      toast.success('Publicité mise à jour');
    } catch (err: unknown) {
      toast.error('Erreur lors de la sauvegarde', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <ShieldAlert className="w-10 h-10" />
        <p className="text-sm font-medium">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const textAds = ads.filter((a) => a.type === 'text');
  const imageAds = ads.filter((a) => a.type === 'image');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-600" />
            Gestion des publicités
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Activez, désactivez et éditez les publicités affichées aux utilisateurs gratuits.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAds} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Text / Upsell ads */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Publicités upsell ({textAds.length})
              </h2>
              <Badge className="text-[10px] border-0 bg-slate-100 text-slate-500">
                {textAds.filter((a) => a.enabled).length} actives
              </Badge>
            </div>
            <Card>
              <CardContent className="p-4 space-y-2">
                {textAds.map((ad) => (
                  <TextAdRow
                    key={ad.id}
                    ad={ad}
                    onSave={handleSave}
                    saving={savingId === ad.id}
                  />
                ))}
                {textAds.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Aucune publicité texte</p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Image ads */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Publicités image ({imageAds.length})
              </h2>
              <Badge className="text-[10px] border-0 bg-slate-100 text-slate-500">
                {imageAds.filter((a) => a.enabled).length} actives
              </Badge>
            </div>
            <Card>
              <CardContent className="p-4 space-y-2">
                {imageAds.map((ad) => (
                  <ImageAdRow
                    key={ad.id}
                    ad={ad}
                    onSave={handleSave}
                    saving={savingId === ad.id}
                  />
                ))}
                {imageAds.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Aucune publicité image</p>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
