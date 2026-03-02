import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Loader2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Leaflet with webpack/vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ParcelleInfo {
  commune: string;
  section: string;
  numero: string;
}

interface GeoResult {
  lat: number;
  lng: number;
  address: string;
  commune: string;
  section: string;
  numero: string;
}

function App() {
  const [parcelle, setParcelle] = useState<ParcelleInfo>({
    commune: '',
    section: '',
    numero: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

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
      // Utilisation de l'API adresse.data.gouv.fr pour géocoder la commune
      const addressQuery = `${parcelle.commune}, France`;
      const geoResponse = await axios.get(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressQuery)}&limit=1`
      );

      if (geoResponse.data.features && geoResponse.data.features.length > 0) {
        const feature = geoResponse.data.features[0];
        const [lng, lat] = feature.geometry.coordinates;
        
        setResult({
          lat,
          lng,
          address: `${parcelle.commune} - Section ${parcelle.section.toUpperCase()} - Parcelle ${parcelle.numero}`,
          commune: parcelle.commune,
          section: parcelle.section.toUpperCase(),
          numero: parcelle.numero,
        });
        // Force map re-render with new key
        setMapKey(prev => prev + 1);
      } else {
        setError('Commune non trouvée. Veuillez vérifier le nom de la commune.');
      }
    } catch (err) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    if (result) {
      window.open(`https://www.google.com/maps?q=${result.lat},${result.lng}`, '_blank');
    }
  };

  const openInOpenStreetMap = () => {
    if (result) {
      window.open(`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lng}#map=16/${result.lat}/${result.lng}`, '_blank');
    }
  };

  const openInGeoportailUrbanisme = () => {
    if (result) {
      const url = `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${result.lng}&lat=${result.lat}&zoom=19&mlon=${result.lng}&mlat=${result.lat}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Recherche Cadastrale
          </h1>
          <p className="text-slate-600">
            Entrez les informations de votre plan cadastral pour obtenir la géolocalisation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Informations du plan cadastral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commune">Commune</Label>
                <Input
                  id="commune"
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  value={parcelle.commune}
                  onChange={(e) => handleInputChange('commune', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="Ex: A, B, C..."
                  value={parcelle.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Numéro de parcelle</Label>
                <Input
                  id="numero"
                  placeholder="Ex: 123, 456..."
                  value={parcelle.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={searchParcelle}
                disabled={loading}
                className="w-full"
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
                    Rechercher
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultat */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="font-medium text-green-800">{result.address}</p>
                    <p className="text-sm text-green-600 mt-1">
                      Latitude: {result.lat.toFixed(6)} | Longitude: {result.lng.toFixed(6)}
                    </p>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <MapContainer
                      key={mapKey}
                      center={[result.lat, result.lng]}
                      zoom={16}
                      scrollWheelZoom={true}
                      style={{ height: '350px', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[result.lat, result.lng]}>
                        <Popup>
                          {result.address}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInGoogleMaps}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Google Maps
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInOpenStreetMap}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      OpenStreetMap
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Référence cadastrale : <span className="font-mono font-medium">{result.commune} {result.section} {result.numero}</span>
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={openInGeoportailUrbanisme}
                      className="w-full bg-blue-700 hover:bg-blue-800"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir sur Géoportail Urbanisme
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                  <div className="text-center text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>La carte s'affichera ici</p>
                    <p className="text-sm">Remplissez le formulaire et cliquez sur Rechercher</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6 shadow-md">
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">1</div>
                <h3 className="font-semibold mb-1">Renseignez les champs</h3>
                <p className="text-sm text-slate-600">Entrez le nom de la commune, la section et le numéro de parcelle de votre plan cadastral.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">2</div>
                <h3 className="font-semibold mb-1">Lancez la recherche</h3>
                <p className="text-sm text-slate-600">Cliquez sur le bouton Rechercher pour géolocaliser votre parcelle.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">3</div>
                <h3 className="font-semibold mb-1">Visualisez sur la carte</h3>
                <p className="text-sm text-slate-600">La localisation s'affiche sur la carte avec les coordonnées GPS.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
