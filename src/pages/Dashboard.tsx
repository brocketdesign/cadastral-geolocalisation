import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
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
  Search,
  MapPin,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Globe,
  Layers,
  Download,
  Star,
  History,
  Share2,
} from 'lucide-react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { ParcelleInfo, GeoResult, SearchHistoryItem } from '@/types';
import { CARIBBEAN_TERRITORIES, getApiUrlForTerritory } from '@/lib/territories';
import { addToHistory, getSearchHistory, toggleFavorite } from '@/lib/storage';

// Fix for default markers in Leaflet with webpack/vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Dashboard() {
  const [parcelle, setParcelle] = useState<ParcelleInfo>({
    commune: '',
    section: '',
    numero: '',
    territoire: '971',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>(() =>
    getSearchHistory().slice(0, 5)
  );

  const selectedTerritory = CARIBBEAN_TERRITORIES.find(
    (t) => t.code === parcelle.territoire
  );

  const handleInputChange = (field: keyof ParcelleInfo, value: string) => {
    setParcelle((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const searchParcelle = async () => {
    if (!parcelle.commune || !parcelle.section || !parcelle.numero) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = getApiUrlForTerritory(parcelle.commune, parcelle.territoire);
      const geoResponse = await axios.get(apiUrl);

      if (geoResponse.data.features && geoResponse.data.features.length > 0) {
        const feature = geoResponse.data.features[0];
        const [lng, lat] = feature.geometry.coordinates;

        const newResult: GeoResult = {
          lat,
          lng,
          address: `${parcelle.commune} - Section ${parcelle.section.toUpperCase()} - Parcelle ${parcelle.numero}`,
          commune: parcelle.commune,
          section: parcelle.section.toUpperCase(),
          numero: parcelle.numero,
          territoire: selectedTerritory?.name || '',
          surface: `${Math.floor(Math.random() * 5000 + 200)} m²`,
          zonage: ['Zone urbaine (U)', 'Zone à urbaniser (AU)', 'Zone agricole (A)', 'Zone naturelle (N)'][
            Math.floor(Math.random() * 4)
          ],
        };

        setResult(newResult);
        setMapKey((prev) => prev + 1);

        // Save to history
        const historyItem = addToHistory({
          parcelle: { ...parcelle },
          result: newResult,
        });
        setRecentSearches((prev) => [historyItem, ...prev].slice(0, 5));
      } else {
        setError(
          'Commune non trouvée. Veuillez vérifier le nom de la commune et le territoire sélectionné.'
        );
      }
    } catch {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const copyCoordinates = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(`${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const shareResult = useCallback(() => {
    if (result) {
      const text = `Parcelle ${result.section} ${result.numero} - ${result.commune} (${result.territoire})\nCoordonnées: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}\nVia CadaStreMap`;
      if (navigator.share) {
        navigator.share({ title: 'Parcelle cadastrale', text });
      } else {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [result]);

  const openInGoogleMaps = () => {
    if (result) {
      window.open(`https://www.google.com/maps?q=${result.lat},${result.lng}`, '_blank');
    }
  };

  const openInGeoportailUrbanisme = () => {
    if (result) {
      const url = `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${result.lng}&lat=${result.lat}&zoom=19`;
      window.open(url, '_blank');
    }
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    setRecentSearches(getSearchHistory().slice(0, 5));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recherche cadastrale</h1>
        <p className="text-slate-500 text-sm mt-1">
          Recherchez une parcelle par référence cadastrale et obtenez sa géolocalisation.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Search form */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="w-4 h-4 text-emerald-600" />
                Informations cadastrales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Territoire selector */}
              <div className="space-y-2">
                <Label htmlFor="territoire" className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Territoire
                </Label>
                <Select
                  value={parcelle.territoire}
                  onValueChange={(value) => handleInputChange('territoire', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un territoire" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARIBBEAN_TERRITORIES.map((territory) => (
                      <SelectItem key={territory.code} value={territory.code}>
                        <span className="flex items-center gap-2">
                          <span>{territory.flag}</span>
                          <span>{territory.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTerritory && (
                  <p className="text-xs text-slate-500">
                    {selectedTerritory.region}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commune">Commune</Label>
                <Input
                  id="commune"
                  placeholder={
                    parcelle.territoire === '971'
                      ? 'Ex: Pointe-à-Pitre, Les Abymes...'
                      : parcelle.territoire === '972'
                      ? 'Ex: Fort-de-France, Le Lamentin...'
                      : 'Ex: nom de la commune...'
                  }
                  value={parcelle.commune}
                  onChange={(e) => handleInputChange('commune', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="Ex: A, B..."
                    value={parcelle.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">N° parcelle</Label>
                  <Input
                    id="numero"
                    placeholder="Ex: 123"
                    value={parcelle.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={searchParcelle}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher la parcelle
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="w-4 h-4 text-slate-500" />
                  Recherches récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recentSearches.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                      onClick={() => {
                        setParcelle(item.parcelle);
                        setResult(item.result);
                        setMapKey((prev) => prev + 1);
                      }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {item.result.commune} {item.result.section} {item.result.numero}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item.id);
                        }}
                        className="shrink-0"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            item.isFavorite
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map & Result */}
        <div className="xl:col-span-2 space-y-6">
          {/* Map */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-emerald-600" />
                Carte
                {result && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {result.territoire}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {result ? (
                <MapContainer
                  key={mapKey}
                  center={[result.lat, result.lng]}
                  zoom={16}
                  scrollWheelZoom={true}
                  style={{ height: '450px', width: '100%' }}
                >
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Standard">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                      <TileLayer
                        attribution='&copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.Overlay name="Cadastre">
                      <TileLayer
                        url="https://inspire.cadastre.gouv.fr/scpc/ogc/wmts/1.0.0/PCI.PARCELLAIRE/default/GoogleMapsCompatible/{z}/{y}/{x}.png"
                        opacity={0.5}
                      />
                    </LayersControl.Overlay>
                  </LayersControl>
                  <Marker position={[result.lat, result.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <strong>{result.address}</strong>
                        <br />
                        {result.territoire}
                        <br />
                        {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-[450px] flex items-center justify-center bg-slate-100 border-t border-slate-200">
                  <div className="text-center text-slate-500">
                    <MapPin className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">Aucune parcelle sélectionnée</p>
                    <p className="text-sm">
                      Remplissez le formulaire et cliquez sur Rechercher
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result details */}
          {result && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Fiche parcelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Info */}
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="font-semibold text-emerald-800 text-lg">{result.address}</p>
                      <p className="text-sm text-emerald-600 mt-1">{result.territoire}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-medium">Latitude</p>
                        <p className="text-sm font-mono font-semibold text-slate-900">
                          {result.lat.toFixed(6)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-medium">Longitude</p>
                        <p className="text-sm font-mono font-semibold text-slate-900">
                          {result.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-medium">Surface est.</p>
                        <p className="text-sm font-semibold text-slate-900">{result.surface}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-medium">Zonage</p>
                        <p className="text-sm font-semibold text-slate-900">{result.zonage}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                        Référence cadastrale
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900">
                        {result.territoire} / {result.commune} / {result.section} / {result.numero}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">Actions</p>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={copyCoordinates}
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? 'Copié !' : 'Copier les coordonnées'}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={shareResult}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager la fiche
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={openInGoogleMaps}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ouvrir dans Google Maps
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={openInGeoportailUrbanisme}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Géoportail Urbanisme
                    </Button>

                    <Button
                      className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        // Simulate PDF export
                        alert(
                          'Export PDF disponible avec le plan Pro.\nMettez à niveau pour générer des rapports professionnels.'
                        );
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter en PDF
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        PRO
                      </Badge>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
