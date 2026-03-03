import { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  FileText,
  Share2,
  Download,
  Mail,
  ChevronDown,
  ChevronUp,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  Copy,
  Loader2,
  Info,
  Zap,
  Building2,
  Shield,
  MapPin,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ComparisonParcel } from '@/types';
import { CARIBBEAN_TERRITORIES } from '@/lib/territories';

// ─── Leaflet default icon fix ────────────────────────────────────────────────
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [20, 33],
  iconAnchor: [10, 33],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PARCELS: ComparisonParcel[] = [
  {
    id: '1',
    ref: '971-0100-A-0023',
    territoire: '971',
    commune: 'Basse-Terre',
    section: 'A',
    numero: '0023',
    lat: 15.9996,
    lng: -61.7246,
    surface: 1200,
    surfaceConstructible: 840,
    prix: 102000,
    zonage: 'U',
    riskScore: 15,
    scoreGlobal: 92,
    cos: '0.30',
    potentielSHON: 360,
    prixMoyenM2Marche: 90,
    tendanceMarche: 'HAUSSE',
    servitudes: [],
    addedAt: Date.now() - 3600000,
  },
  {
    id: '2',
    ref: '971-0234-B-0108',
    territoire: '971',
    commune: 'Pointe-à-Pitre',
    section: 'B',
    numero: '0108',
    lat: 16.2412,
    lng: -61.5334,
    surface: 800,
    surfaceConstructible: 480,
    prix: 96000,
    zonage: 'AU',
    riskScore: 45,
    scoreGlobal: 78,
    cos: '0.25',
    potentielSHON: 200,
    prixMoyenM2Marche: 130,
    tendanceMarche: 'STABLE',
    servitudes: ['Servitude EDF', 'RNU'],
    addedAt: Date.now() - 7200000,
  },
  {
    id: '3',
    ref: '972-0056-C-0045',
    territoire: '972',
    commune: 'Le Lamentin',
    section: 'C',
    numero: '0045',
    lat: 14.614,
    lng: -61.0,
    surface: 1500,
    surfaceConstructible: 1050,
    prix: 105000,
    zonage: 'U',
    riskScore: 20,
    scoreGlobal: 88,
    cos: '0.35',
    potentielSHON: 525,
    prixMoyenM2Marche: 75,
    tendanceMarche: 'HAUSSE',
    servitudes: ['Loi Littoral'],
    addedAt: Date.now() - 10800000,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number, unit = '') =>
  `${new Intl.NumberFormat('fr-FR').format(n)}${unit ? ' ' + unit : ''}`;

const prixM2 = (p: ComparisonParcel) => Math.round(p.prix / p.surface);
const prixM2Constructible = (p: ComparisonParcel) =>
  p.surfaceConstructible > 0 ? Math.round(p.prix / p.surfaceConstructible) : 0;
const roiEstime = (p: ComparisonParcel) => {
  const prixVente = p.surface * p.prixMoyenM2Marche;
  const notaire = p.prix * 0.08;
  return Math.round(((prixVente - p.prix - notaire) / (p.prix + notaire)) * 100);
};

function riskColor(score: number) {
  if (score <= 20) return 'text-emerald-600';
  if (score <= 40) return 'text-yellow-500';
  if (score <= 60) return 'text-orange-500';
  return 'text-red-600';
}
function riskDot(score: number) {
  if (score <= 20) return '🟢';
  if (score <= 40) return '🟡';
  if (score <= 60) return '🟠';
  return '🔴';
}
function trendIcon(t: ComparisonParcel['tendanceMarche']) {
  if (t === 'HAUSSE') return <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline-block ml-1" />;
  if (t === 'BAISSE') return <TrendingDown className="w-3.5 h-3.5 text-red-500 inline-block ml-1" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400 inline-block ml-1" />;
}

type WinnerMap = {
  meilleurPrixM2: string;
  meilleureConstruction: string;
  moinsDeRisques: string;
  meilleurScore: string;
  meilleurROI: string;
};

function computeWinners(parcels: ComparisonParcel[]): WinnerMap {
  if (parcels.length === 0)
    return {
      meilleurPrixM2: '',
      meilleureConstruction: '',
      moinsDeRisques: '',
      meilleurScore: '',
      meilleurROI: '',
    };
  const best = (fn: (p: ComparisonParcel) => number, asc = true) => {
    return [...parcels].sort((a, b) => (asc ? fn(a) - fn(b) : fn(b) - fn(a)))[0].id;
  };
  return {
    meilleurPrixM2: best(prixM2, true),
    meilleureConstruction: best((p) => p.potentielSHON, false),
    moinsDeRisques: best((p) => p.riskScore, true),
    meilleurScore: best((p) => p.scoreGlobal, false),
    meilleurROI: best(roiEstime, false),
  };
}

// ─── Add Parcel Dialog ────────────────────────────────────────────────────────
interface AddParcelDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (parcel: ComparisonParcel) => void;
  existingCount: number;
}

function AddParcelDialog({ open, onClose, onAdd, existingCount }: AddParcelDialogProps) {
  const [territoire, setTerritoire] = useState('971');
  const [commune, setCommune] = useState('');
  const [section, setSection] = useState('');
  const [numero, setNumero] = useState('');
  const [surface, setSurface] = useState('');
  const [surfConstr, setSurfConstr] = useState('');
  const [prix, setPrix] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!commune.trim()) e.commune = 'Commune requise';
    if (!section.trim()) e.section = 'Section requise';
    if (!numero.trim()) e.numero = 'Numéro requis';
    if (!surface || isNaN(Number(surface)) || Number(surface) <= 0) e.surface = 'Surface invalide';
    if (!prix || isNaN(Number(prix)) || Number(prix) <= 0) e.prix = 'Prix invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    // Simulate async fetch / enrichment
    setTimeout(() => {
      const territory = CARIBBEAN_TERRITORIES.find((t) => t.code === territoire);
      const surf = Number(surface);
      const surfC = surfConstr ? Number(surfConstr) : Math.round(surf * 0.7);
      const p = Number(prix);
      const newParcel: ComparisonParcel = {
        id: `custom-${Date.now()}`,
        ref: `${territoire}-${commune.slice(0, 4).toUpperCase()}-${section.toUpperCase()}-${numero}`,
        territoire,
        commune,
        section: section.toUpperCase(),
        numero,
        lat: territory ? territory.center[0] + (Math.random() - 0.5) * 0.1 : 16.0,
        lng: territory ? territory.center[1] + (Math.random() - 0.5) * 0.1 : -61.7,
        surface: surf,
        surfaceConstructible: surfC,
        prix: p,
        zonage: ['U', 'AU', 'A', 'N'][Math.floor(Math.random() * 4)],
        riskScore: Math.floor(Math.random() * 60) + 5,
        scoreGlobal: Math.floor(Math.random() * 40) + 60,
        cos: (Math.random() * 0.3 + 0.2).toFixed(2),
        potentielSHON: Math.round(surfC * (Math.random() * 0.2 + 0.25)),
        prixMoyenM2Marche: Math.round(p / surf * (0.9 + Math.random() * 0.4)),
        tendanceMarche: (['HAUSSE', 'STABLE', 'BAISSE'] as const)[Math.floor(Math.random() * 3)],
        servitudes: [],
        addedAt: Date.now(),
      };
      onAdd(newParcel);
      setLoading(false);
      // reset
      setCommune(''); setSection(''); setNumero(''); setSurface(''); setSurfConstr(''); setPrix('');
      setErrors({});
      onClose();
      toast.success('Parcelle ajoutée à la comparaison');
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Ajouter une parcelle
          </DialogTitle>
          <DialogDescription>
            Renseignez la référence cadastrale et les données foncières. Les métriques seront calculées
            automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Territoire */}
          <div className="space-y-1">
            <Label>Territoire</Label>
            <Select value={territoire} onValueChange={setTerritoire}>
              <SelectTrigger>
                <SelectValue placeholder="Territoire" />
              </SelectTrigger>
              <SelectContent>
                {CARIBBEAN_TERRITORIES.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commune + Section + Numéro */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 space-y-1">
              <Label>Commune</Label>
              <Input
                placeholder="ex. Basse-Terre"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
              />
              {errors.commune && <p className="text-xs text-red-500">{errors.commune}</p>}
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Input
                placeholder="A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                maxLength={2}
              />
              {errors.section && <p className="text-xs text-red-500">{errors.section}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Numéro</Label>
              <Input
                placeholder="0023"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
              {errors.numero && <p className="text-xs text-red-500">{errors.numero}</p>}
            </div>
          </div>

          {/* Surface */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Surface totale (m²)</Label>
              <Input
                type="number"
                placeholder="1200"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
              />
              {errors.surface && <p className="text-xs text-red-500">{errors.surface}</p>}
            </div>
            <div className="space-y-1">
              <Label>Surface constructible (m²)</Label>
              <Input
                type="number"
                placeholder="840 (optionnel)"
                value={surfConstr}
                onChange={(e) => setSurfConstr(e.target.value)}
              />
              <p className="text-xs text-slate-400">Auto: 70 % si vide</p>
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-1">
            <Label>Prix d'achat (€)</Label>
            <Input
              type="number"
              placeholder="102000"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
            />
            {errors.prix && <p className="text-xs text-red-500">{errors.prix}</p>}
          </div>

          {existingCount >= 5 && (
            <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700">
              Limite de 5 parcelles atteinte. Supprimez-en une avant d'ajouter.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || existingCount >= 5}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mini Map ─────────────────────────────────────────────────────────────────
function MiniMap({ lat, lng, mapId }: { lat: number; lng: number; mapId: string }) {
  return (
    <div className="h-36 w-full rounded-md overflow-hidden border border-slate-200">
      <MapContainer
        key={mapId}
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 100, color = 'bg-emerald-500' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

// ─── Parcel Card ──────────────────────────────────────────────────────────────
interface ParcelCardProps {
  parcel: ComparisonParcel;
  winners: WinnerMap;
  onRemove: (id: string) => void;
  onViewDetail: (parcel: ComparisonParcel) => void;
}

function ParcelCard({ parcel, winners, onRemove, onViewDetail }: ParcelCardProps) {
  const pm2 = prixM2(parcel);
  const pm2c = prixM2Constructible(parcel);
  const roi = roiEstime(parcel);

  const isBestScore = winners.meilleurScore === parcel.id;
  const isBestPrix = winners.meilleurPrixM2 === parcel.id;
  const isBestConstr = winners.meilleureConstruction === parcel.id;
  const isBestRisk = winners.moinsDeRisques === parcel.id;
  const isBestROI = winners.meilleurROI === parcel.id;

  const winnerCount = [isBestScore, isBestPrix, isBestConstr, isBestRisk, isBestROI].filter(Boolean).length;

  return (
    <Card
      className={`flex flex-col min-w-[220px] max-w-[280px] flex-shrink-0 relative transition-shadow hover:shadow-md ${
        isBestScore ? 'ring-2 ring-emerald-500 shadow-emerald-100 shadow-md' : ''
      }`}
    >
      {/* Trophy badge */}
      {winnerCount > 0 && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-amber-400 text-amber-900 font-semibold text-xs px-2 py-0.5 shadow-sm">
            <Trophy className="w-3 h-3 mr-1 inline-block" />
            {winnerCount > 1 ? `${winnerCount}× Meilleur` : 'Meilleur'}
          </Badge>
        </div>
      )}

      <CardHeader className="px-3 pt-5 pb-2">
        {/* Mini map */}
        <MiniMap lat={parcel.lat} lng={parcel.lng} mapId={`map-${parcel.id}`} />

        {/* Reference */}
        <div className="mt-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Référence</p>
          <p className="text-sm font-mono font-semibold text-slate-800 truncate" title={parcel.ref}>
            {parcel.ref}
          </p>
          <p className="text-xs text-slate-500">{parcel.commune}</p>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 flex flex-col gap-2.5 flex-1">
        {/* Zonage */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Zonage</span>
          <Badge variant="outline" className="text-xs font-semibold">
            {parcel.zonage}
          </Badge>
        </div>

        {/* Surface */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Surface totale</span>
            <span className="font-semibold text-slate-800">{fmtNum(parcel.surface, 'm²')}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-400">dont constructible</span>
            <span className="text-slate-600">{fmtNum(parcel.surfaceConstructible, 'm²')}</span>
          </div>
        </div>

        {/* Prix */}
        <div className="border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Prix</span>
            <span className="font-bold text-slate-800">{fmtEuro(parcel.prix)}</span>
          </div>

          {/* Prix/m² */}
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500">€/m²</span>
            <span className={`font-semibold flex items-center gap-1 ${isBestPrix ? 'text-emerald-600' : 'text-slate-700'}`}>
              {fmtEuro(pm2)}
              {isBestPrix && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>💰 Meilleur prix/m²</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
          </div>

          {/* Prix/m² constructible */}
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-400">€/m² constr.</span>
            <span className="text-slate-600">{fmtEuro(pm2c)}</span>
          </div>
        </div>

        {/* Potentiel SHON */}
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
          <span className="text-slate-500 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Potentiel SHON
          </span>
          <span className={`font-semibold ${isBestConstr ? 'text-emerald-600' : 'text-slate-700'}`}>
            {fmtNum(parcel.potentielSHON, 'm²')}
            {isBestConstr && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1">🏗️</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>🏗️ Meilleur potentiel construction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        </div>

        {/* ROI */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            ROI estimé
          </span>
          <span className={`font-semibold ${roi >= 15 ? 'text-emerald-600' : roi >= 5 ? 'text-yellow-600' : 'text-red-500'}`}>
            {roi > 0 ? '+' : ''}{roi}%
            {isBestROI && ' 📈'}
          </span>
        </div>

        {/* Marché */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Prix marché</span>
          <span className="text-slate-700">
            {fmtEuro(parcel.prixMoyenM2Marche)}/m²
            {trendIcon(parcel.tendanceMarche)}
          </span>
        </div>

        {/* Risk Score */}
        <div className="border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Score de risque
            </span>
            <span className={`font-semibold ${isBestRisk ? 'text-emerald-600' : riskColor(parcel.riskScore)}`}>
              {riskDot(parcel.riskScore)} {parcel.riskScore}/100
              {isBestRisk && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1">⚡</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>⚡ Moins de risques</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
          </div>
          <ScoreBar
            value={parcel.riskScore}
            color={parcel.riskScore <= 20 ? 'bg-emerald-500' : parcel.riskScore <= 40 ? 'bg-yellow-400' : 'bg-red-400'}
          />
        </div>

        {/* Global Score */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Score global</span>
            <span className={`font-bold text-base ${isBestScore ? 'text-emerald-700' : 'text-slate-800'}`}>
              {parcel.scoreGlobal}
              {isBestScore && ' 🏆'}
            </span>
          </div>
          <ScoreBar
            value={parcel.scoreGlobal}
            color={
              parcel.scoreGlobal >= 85
                ? 'bg-emerald-500'
                : parcel.scoreGlobal >= 70
                ? 'bg-sky-500'
                : 'bg-orange-400'
            }
          />
        </div>

        {/* Servitudes */}
        {parcel.servitudes.length > 0 && (
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-2">
            <span className="text-orange-500 font-medium">⚠️ Servitudes :</span>{' '}
            {parcel.servitudes.join(', ')}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7"
            onClick={() => onViewDetail(parcel)}
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            Détail
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onRemove(parcel.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Add Slot Card ────────────────────────────────────────────────────────────
function AddSlotCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-w-[220px] max-w-[280px] flex-shrink-0 h-full min-h-[420px] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
        <Plus className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
      </div>
      <div className="text-center px-4">
        <p className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700">Ajouter une parcelle</p>
        <p className="text-xs text-slate-400 mt-1">Référence cadastrale ou depuis l'historique</p>
      </div>
    </button>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────
interface ComparisonTableProps {
  parcels: ComparisonParcel[];
  winners: WinnerMap;
}

function ComparisonTable({ parcels, winners }: ComparisonTableProps) {
  if (parcels.length === 0) return null;

  type RowDef = {
    label: string;
    getValue: (p: ComparisonParcel) => React.ReactNode;
    winner?: keyof WinnerMap;
    hint?: string;
  };

  const rows: RowDef[] = [
    { label: 'Territoire', getValue: (p) => p.territoire },
    { label: 'Commune', getValue: (p) => p.commune },
    { label: 'Référence', getValue: (p) => <span className="font-mono text-xs">{p.ref}</span> },
    { label: 'Zonage', getValue: (p) => <Badge variant="outline">{p.zonage}</Badge> },
    {
      label: 'Surface totale',
      getValue: (p) => fmtNum(p.surface, 'm²'),
    },
    {
      label: 'Surface constructible',
      getValue: (p) => fmtNum(p.surfaceConstructible, 'm²'),
    },
    {
      label: 'COS',
      getValue: (p) => p.cos,
      hint: "Coefficient d'Occupation du Sol",
    },
    {
      label: "Prix d'achat",
      getValue: (p) => <span className="font-bold">{fmtEuro(p.prix)}</span>,
    },
    {
      label: '€/m²',
      getValue: (p) => fmtEuro(prixM2(p)),
      winner: 'meilleurPrixM2',
      hint: "Prix d'achat divisé par la surface totale",
    },
    {
      label: '€/m² constructible',
      getValue: (p) => fmtEuro(prixM2Constructible(p)),
      hint: "Prix d'achat divisé par la surface constructible",
    },
    {
      label: 'Potentiel SHON',
      getValue: (p) => fmtNum(p.potentielSHON, 'm²'),
      winner: 'meilleureConstruction',
    },
    {
      label: 'ROI estimé',
      getValue: (p) => {
        const r = roiEstime(p);
        return (
          <span className={r >= 15 ? 'text-emerald-600 font-semibold' : r >= 5 ? 'text-yellow-600' : 'text-red-500'}>
            {r > 0 ? '+' : ''}{r}%
          </span>
        );
      },
      winner: 'meilleurROI',
    },
    {
      label: 'Prix marché (€/m²)',
      getValue: (p) => (
        <span>
          {fmtEuro(p.prixMoyenM2Marche)} {trendIcon(p.tendanceMarche)}
        </span>
      ),
    },
    {
      label: 'Score de risque',
      getValue: (p) => (
        <span className={`flex items-center gap-1 font-semibold ${riskColor(p.riskScore)}`}>
          {riskDot(p.riskScore)} {p.riskScore}/100
        </span>
      ),
      winner: 'moinsDeRisques',
    },
    {
      label: 'Score global',
      getValue: (p) => (
        <span className={`font-bold text-base ${p.scoreGlobal >= 85 ? 'text-emerald-700' : 'text-slate-700'}`}>
          {p.scoreGlobal}/100
        </span>
      ),
      winner: 'meilleurScore',
    },
    {
      label: 'Servitudes',
      getValue: (p) =>
        p.servitudes.length === 0 ? (
          <span className="text-emerald-600 text-xs">Aucune</span>
        ) : (
          <span className="text-orange-600 text-xs">{p.servitudes.join(', ')}</span>
        ),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-44 text-slate-600 font-semibold">Critère</TableHead>
            {parcels.map((p) => (
              <TableHead key={p.id} className="text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-xs text-slate-500">{p.ref}</span>
                  <span className="text-xs text-slate-400">{p.commune}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label} className="hover:bg-slate-50/50">
              <TableCell className="font-medium text-sm text-slate-700 py-2.5">
                <span className="flex items-center gap-1.5">
                  {row.label}
                  {row.hint && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-slate-300 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">{row.hint}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </span>
              </TableCell>
              {parcels.map((p) => {
                const isWinner = row.winner ? winners[row.winner] === p.id : false;
                return (
                  <TableCell
                    key={p.id}
                    className={`text-center py-2.5 text-sm ${isWinner ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      {row.getValue(p)}
                      {isWinner && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          ✓ Meilleur
                        </span>
                      )}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ParcelDetailModal({ parcel, onClose }: { parcel: ComparisonParcel | null; onClose: () => void }) {
  if (!parcel) return null;
  const pm2 = prixM2(parcel);
  const roi = roiEstime(parcel);

  return (
    <Dialog open={!!parcel} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{parcel.ref}</DialogTitle>
          <DialogDescription>{parcel.commune} · {parcel.territoire}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <MiniMap lat={parcel.lat} lng={parcel.lng} mapId={`detail-${parcel.id}`} />

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Zonage PLU', parcel.zonage],
              ['COS', parcel.cos],
              ['Surface totale', fmtNum(parcel.surface, 'm²')],
              ['Surface constructible', fmtNum(parcel.surfaceConstructible, 'm²')],
              ["Prix d'achat", fmtEuro(parcel.prix)],
              ['€/m²', fmtEuro(pm2)],
              ['Potentiel SHON', fmtNum(parcel.potentielSHON, 'm²')],
              ['ROI estimé', `${roi > 0 ? '+' : ''}${roi}%`],
              ['Score de risque', `${parcel.riskScore}/100`],
              ['Score global', `${parcel.scoreGlobal}/100`],
              ['Marché', `${fmtEuro(parcel.prixMoyenM2Marche)}/m²`],
              ['Tendance', parcel.tendanceMarche],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-slate-50 rounded-md px-3 py-2">
                <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                <p className="font-semibold text-slate-800">{v}</p>
              </div>
            ))}
          </div>

          {parcel.servitudes.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md px-3 py-2 text-sm">
              <p className="font-semibold text-orange-700 mb-1">Servitudes & contraintes</p>
              <ul className="list-disc list-inside text-orange-600 text-xs space-y-0.5">
                {parcel.servitudes.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function WinnerLegend({ winners, parcels }: { winners: WinnerMap; parcels: ComparisonParcel[] }) {
  const getCommune = (id: string) => parcels.find((p) => p.id === id)?.commune ?? '—';
  const items = [
    { icon: '💰', label: 'Meilleur prix/m²', id: winners.meilleurPrixM2 },
    { icon: '🏗️', label: 'Meilleur potentiel construction', id: winners.meilleureConstruction },
    { icon: '⚡', label: 'Moins de risques', id: winners.moinsDeRisques },
    { icon: '🏆', label: 'Meilleur score global', id: winners.meilleurScore },
    { icon: '📈', label: 'Meilleur ROI estimé', id: winners.meilleurROI },
  ];
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-sm"
        >
          <span>{item.icon}</span>
          <span className="text-slate-500">{item.label} :</span>
          <span className="font-semibold text-slate-800">{getCommune(item.id)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ParcelComparison() {
  const [parcels, setParcels] = useState<ComparisonParcel[]>(MOCK_PARCELS);
  const [addOpen, setAddOpen] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [detailParcel, setDetailParcel] = useState<ComparisonParcel | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const winners = useMemo(() => computeWinners(parcels), [parcels]);

  const handleRemove = useCallback((id: string) => {
    setParcels((prev) => prev.filter((p) => p.id !== id));
    toast.info('Parcelle retirée de la comparaison');
  }, []);

  const handleAdd = useCallback((parcel: ComparisonParcel) => {
    setParcels((prev) => [...prev, parcel]);
  }, []);

  const handleClear = () => {
    setParcels([]);
    toast.info('Comparaison vidée');
  };

  const handleExportPDF = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Génération du PDF…',
        success: 'PDF téléchargé',
        error: 'Erreur lors de la génération',
      }
    );
  };

  const handleShareLink = () => {
    setShareLoading(true);
    setTimeout(() => {
      const url = `${window.location.origin}/comparison?ids=${parcels.map((p) => p.id).join(',')}`;
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success('Lien copié dans le presse-papiers'))
        .catch(() => toast.error('Impossible de copier le lien'));
      setShareLoading(false);
    }, 600);
  };

  const handleSendEmail = () => {
    toast.info("Ouverture du modèle d'e-mail…");
    setTimeout(() => {
      window.open(
        `mailto:?subject=Comparaison Foncière&body=Bonjour,%0A%0AVeuillez trouver ci-joint la comparaison des parcelles sélectionnées.%0A%0ACordialmente,`,
        '_blank'
      );
    }, 300);
  };

  return (
    <div className="space-y-6 p-1">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Comparaison Foncière
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Comparez jusqu'à 5 parcelles côte à côte — métriques, risques et potentiel
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setAddOpen(true)}
            disabled={parcels.length >= 5}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter une parcelle
          </Button>

          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 h-8 border-slate-300">
            <MapPin className="w-3 h-3 mr-1 text-emerald-500" />
            {parcels.length}/5 parcelles
          </Badge>

          {parcels.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleClear}
            >
              <X className="w-4 h-4 mr-1" />
              Vider
            </Button>
          )}

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={parcels.length === 0}>
                <Download className="w-4 h-4 mr-1.5" />
                Exporter
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2 text-sky-500" />
                Télécharger PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShareLink} disabled={shareLoading}>
                {shareLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2 text-violet-500" />
                )}
                Copier le lien
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendEmail}>
                <Mail className="w-4 h-4 mr-2 text-emerald-500" />
                Envoyer par e-mail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Winner Legend ─────────────────────────────────────────────────── */}
      {parcels.length >= 2 && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Meilleurs résultats
          </p>
          <WinnerLegend winners={winners} parcels={parcels} />
        </div>
      )}

      {/* ── Split View ────────────────────────────────────────────────────── */}
      {parcels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-semibold text-lg">Aucune parcelle à comparer</p>
            <p className="text-slate-400 text-sm mt-1">
              Ajoutez des parcelles pour démarrer une comparaison foncière
            </p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter la première parcelle
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {parcels.map((p) => (
              <ParcelCard
                key={p.id}
                parcel={p}
                winners={winners}
                onRemove={handleRemove}
                onViewDetail={setDetailParcel}
              />
            ))}
            {parcels.length < 5 && <AddSlotCard onClick={() => setAddOpen(true)} />}
          </div>
        </div>
      )}

      {/* ── Detailed Comparison Table ─────────────────────────────────────── */}
      {parcels.length >= 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
            onClick={() => setTableExpanded((v) => !v)}
          >
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-500" />
              Tableau comparatif détaillé
              <Badge variant="secondary" className="text-xs">
                {parcels.length} parcelles
              </Badge>
            </span>
            {tableExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {tableExpanded && (
            <div className="px-5 pb-5">
              <ComparisonTable parcels={parcels} winners={winners} />
            </div>
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AddParcelDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        existingCount={parcels.length}
      />

      <ParcelDetailModal
        parcel={detailParcel}
        onClose={() => setDetailParcel(null)}
      />
    </div>
  );
}
