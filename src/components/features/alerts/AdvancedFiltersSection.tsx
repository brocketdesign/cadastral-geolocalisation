import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SlidersHorizontal } from 'lucide-react';
import type { AdvancedFilters, ParcelType, ZonagePLU } from '@/types/alerts';

interface AdvancedFiltersSectionProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
}

const PARCEL_TYPES: { value: ParcelType; label: string }[] = [
  { value: 'constructible', label: 'Constructible' },
  { value: 'agricole', label: 'Agricole' },
  { value: 'mixte', label: 'Mixte' },
];

const PLU_ZONES: { value: ZonagePLU; label: string; color: string }[] = [
  { value: 'U', label: 'U (Urbaine)', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'AU', label: 'AU (À urbaniser)', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'NC', label: 'NC (Naturelle)', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'A', label: 'A (Agricole)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

export default function AdvancedFiltersSection({
  filters,
  onFiltersChange,
}: AdvancedFiltersSectionProps) {
  const toggleParcelType = (type: ParcelType) => {
    const current = filters.parcelTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, parcelTypes: updated });
  };

  const toggleZonage = (zone: ZonagePLU) => {
    const current = filters.zonagePLU;
    const updated = current.includes(zone)
      ? current.filter((z) => z !== zone)
      : [...current, zone];
    onFiltersChange({ ...filters, zonagePLU: updated });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
          Filtres avancés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Surface */}
        <div className="space-y-2">
          <Label className="font-medium">Surface (m²)</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={filters.minSurface ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minSurface: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Min"
              className="w-32"
            />
            <span className="text-slate-400">à</span>
            <Input
              type="number"
              value={filters.maxSurface ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxSurface: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Max"
              className="w-32"
            />
            <span className="text-sm text-slate-500">m²</span>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label className="font-medium">Prix (€)</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={filters.priceMin ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priceMin: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Min"
              className="w-32"
            />
            <span className="text-slate-400">à</span>
            <Input
              type="number"
              value={filters.priceMax ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priceMax: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Max"
              className="w-32"
            />
            <span className="text-sm text-slate-500">€</span>
          </div>
        </div>

        {/* Parcel Type */}
        <div className="space-y-2">
          <Label className="font-medium">Type de parcelle</Label>
          <div className="flex flex-wrap gap-2">
            {PARCEL_TYPES.map((type) => {
              const isSelected = filters.parcelTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  onClick={() => toggleParcelType(type.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoning PLU */}
        <div className="space-y-2">
          <Label className="font-medium">Zonage PLU</Label>
          <div className="flex flex-wrap gap-2">
            {PLU_ZONES.map((zone) => {
              const isSelected = filters.zonagePLU.includes(zone.value);
              return (
                <button
                  key={zone.value}
                  onClick={() => toggleZonage(zone.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    isSelected
                      ? zone.color
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{zone.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buildable only */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
          <div>
            <Label className="font-medium text-sm">
              Parcelles constructibles uniquement
            </Label>
            <p className="text-xs text-slate-500">
              Filtrer les résultats pour n&apos;afficher que les parcelles constructibles
            </p>
          </div>
          <Switch
            checked={filters.buildableOnly}
            onCheckedChange={(v) =>
              onFiltersChange({ ...filters, buildableOnly: v })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
