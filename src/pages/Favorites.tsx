import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar } from 'lucide-react';
import type { SearchHistoryItem } from '@/types';
import { getFavorites, toggleFavorite } from '@/lib/storage';

export default function Favorites() {
  const [favorites, setFavorites] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemoveFavorite = (id: string) => {
    toggleFavorite(id);
    setFavorites(getFavorites());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parcelles favorites</h1>
        <p className="text-slate-500 text-sm mt-1">
          {favorites.length} parcelle{favorites.length > 1 ? 's' : ''} en favoris
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((item) => (
            <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {item.result.commune} — {item.result.section} {item.result.numero}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {item.result.territoire}
                    </Badge>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.result.lat.toFixed(4)}, {item.result.lng.toFixed(4)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-2 rounded-md hover:bg-red-50 transition-colors shrink-0"
                    title="Retirer des favoris"
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 hover:text-red-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Aucune parcelle en favoris
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Cliquez sur l'étoile dans vos résultats de recherche pour ajouter une parcelle à vos favoris.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
