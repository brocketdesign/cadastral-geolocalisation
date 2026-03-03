import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Bell,
  Eye,
  Circle,
  CheckCircle2,
} from 'lucide-react';
import type { AlertZone, ZoneType, AlertTerritory } from '@/types/alerts';
import { COMMUNES_BY_TERRITORY } from '@/lib/mock-alerts';

interface AlertZonesSectionProps {
  zones: AlertZone[];
  territory: AlertTerritory;
  onZonesChange: (zones: AlertZone[]) => void;
  onTestAlert: (zoneId: string) => void;
}

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  commune: 'Commune',
  polygon: 'Polygone personnalisé',
  radius: 'Rayon autour d\'un point',
};

const ZONE_TYPE_ICONS: Record<ZoneType, string> = {
  commune: '🏠',
  polygon: '🗺️',
  radius: '📍',
};

export default function AlertZonesSection({
  zones,
  territory,
  onZonesChange,
  onTestAlert,
}: AlertZonesSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AlertZone | null>(null);
  const [newZone, setNewZone] = useState<Partial<AlertZone>>({
    name: '',
    zoneType: 'commune',
    communes: [],
    radiusKm: 5,
    isActive: true,
  });

  const communes = COMMUNES_BY_TERRITORY[territory] || [];

  const handleCreateZone = () => {
    const zone: AlertZone = {
      id: `zone_${Date.now()}`,
      userId: 'usr_001',
      name: newZone.name || 'Sans nom',
      zoneType: newZone.zoneType || 'commune',
      communes: newZone.communes,
      center: newZone.zoneType === 'radius' ? { lat: 16.265, lng: -61.551 } : undefined,
      radiusKm: newZone.zoneType === 'radius' ? newZone.radiusKm : undefined,
      geometry:
        newZone.zoneType === 'polygon'
          ? {
              type: 'Polygon',
              coordinates: [
                [
                  [-61.58, 16.28],
                  [-61.55, 16.28],
                  [-61.55, 16.25],
                  [-61.58, 16.25],
                  [-61.58, 16.28],
                ],
              ],
            }
          : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    onZonesChange([...zones, zone]);
    setDialogOpen(false);
    resetForm();
  };

  const handleDeleteZone = (id: string) => {
    onZonesChange(zones.filter((z) => z.id !== id));
  };

  const handleToggleActive = (id: string) => {
    onZonesChange(
      zones.map((z) => (z.id === id ? { ...z, isActive: !z.isActive } : z))
    );
  };

  const resetForm = () => {
    setNewZone({
      name: '',
      zoneType: 'commune',
      communes: [],
      radiusKm: 5,
      isActive: true,
    });
    setEditingZone(null);
  };

  const handleEditZone = (zone: AlertZone) => {
    setEditingZone(zone);
    setNewZone({
      name: zone.name,
      zoneType: zone.zoneType,
      communes: zone.communes,
      radiusKm: zone.radiusKm,
    });
    setDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingZone) return;
    onZonesChange(
      zones.map((z) =>
        z.id === editingZone.id
          ? {
              ...z,
              name: newZone.name || z.name,
              zoneType: newZone.zoneType || z.zoneType,
              communes: newZone.communes,
              radiusKm: newZone.radiusKm,
            }
          : z
      )
    );
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-emerald-600" />
          Mes zones d&apos;alerte
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Modifier la zone' : 'Créer une zone d\'alerte'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Nom de la zone */}
              <div className="space-y-1.5">
                <Label>Nom de la zone</Label>
                <Input
                  value={newZone.name || ''}
                  onChange={(e) =>
                    setNewZone({ ...newZone, name: e.target.value })
                  }
                  placeholder="Ex: Baie-Mahault Centre"
                />
              </div>

              {/* Type de zone */}
              <div className="space-y-1.5">
                <Label>Type de zone</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['commune', 'polygon', 'radius'] as ZoneType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setNewZone({ ...newZone, zoneType: type })
                        }
                        className={`p-3 rounded-lg border text-center transition-all text-sm ${
                          newZone.zoneType === type
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{ZONE_TYPE_ICONS[type]}</div>
                        {ZONE_TYPE_LABELS[type]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Sélection de commune */}
              {newZone.zoneType === 'commune' && (
                <div className="space-y-1.5">
                  <Label>Commune(s)</Label>
                  <Select
                    value={newZone.communes?.[0] || ''}
                    onValueChange={(v) =>
                      setNewZone({ ...newZone, communes: [v] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communes.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Polygone - carte simulée */}
              {newZone.zoneType === 'polygon' && (
                <div className="space-y-1.5">
                  <Label>Dessiner sur la carte</Label>
                  <div className="h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Carte interactive Leaflet</p>
                      <p className="text-xs">(Outil de dessin de polygone)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rayon */}
              {newZone.zoneType === 'radius' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Point central</Label>
                    <div className="h-36 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Cliquez sur la carte</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Rayon : {newZone.radiusKm || 5} km
                    </Label>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={newZone.radiusKm || 5}
                      onChange={(e) =>
                        setNewZone({
                          ...newZone,
                          radiusKm: Number(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Référence parcelle */}
              <div className="space-y-1.5">
                <Label>Référence parcelle (optionnel)</Label>
                <Input placeholder="Ex: AB-0234" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={editingZone ? handleSaveEdit : handleCreateZone}
                disabled={!newZone.name}
              >
                {editingZone ? 'Enregistrer' : 'Créer la zone'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {zones.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Aucune zone configurée</p>
            <p className="text-sm">Créez votre première zone d&apos;alerte</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className={`p-4 rounded-lg border transition-all ${
                  zone.isActive
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {ZONE_TYPE_ICONS[zone.zoneType]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {zone.name}
                        </h3>
                        {zone.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Type : {ZONE_TYPE_LABELS[zone.zoneType]}
                        {zone.communes?.length
                          ? ` | ${zone.communes.join(', ')}`
                          : ''}
                        {zone.radiusKm
                          ? ` | Rayon ${zone.radiusKm} km`
                          : ''}
                        {zone.geometry
                          ? ` | Polygone personnalisé`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 ml-9">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleEditZone(zone)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  {zone.zoneType !== 'commune' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Voir sur carte
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => onTestAlert(zone.id)}
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Test alerte
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleToggleActive(zone.id)}
                  >
                    {zone.isActive ? (
                      <Circle className="w-3 h-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {zone.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDeleteZone(zone.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
