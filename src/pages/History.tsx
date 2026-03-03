import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Star,
  Trash2,
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import type { SearchHistoryItem } from '@/types';
import { getSearchHistory, toggleFavorite, removeFromHistory, clearHistory } from '@/lib/storage';
import UpgradeGate from '@/components/features/UpgradeGate';

export default function HistoryPage() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getSearchHistory().then(setHistory);
  }, []);

  const refreshHistory = async () => {
    const items = await getSearchHistory();
    setHistory(items);
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
    await refreshHistory();
  };

  const handleRemove = async (id: string) => {
    await removeFromHistory(id);
    await refreshHistory();
  };

  const handleClearAll = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer tout l\'historique ?')) {
      await clearHistory();
      await refreshHistory();
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!filter) return true;
    const searchText = `${item.result.commune} ${item.result.section} ${item.result.numero} ${item.result.territoire}`.toLowerCase();
    return searchText.includes(filter.toLowerCase());
  });

  return (
    <UpgradeGate
      requiredPlan="pro"
      featureLabel="L'historique complet des recherches est réservé au plan Pro. Passez au Pro pour retrouver toutes vos recherches passées."
      blurContent
    >
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique des recherches</h1>
          <p className="text-slate-500 text-sm mt-1">
            {history.length} recherche{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-1" />
            Tout supprimer
          </Button>
        )}
      </div>

      {/* Search filter */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Filtrer par commune, section, numéro..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* History list */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {item.result.commune} — {item.result.section} {item.result.numero}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {item.result.territoire}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-mono text-xs">
                        {item.result.lat.toFixed(4)}, {item.result.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                      title={item.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.isFavorite
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            {history.length === 0 ? (
              <>
                <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Aucune recherche enregistrée
                </h3>
                <p className="text-sm text-slate-500">
                  Vos recherches cadastrales apparaîtront ici automatiquement.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Aucun résultat
                </h3>
                <p className="text-sm text-slate-500">
                  Aucune recherche ne correspond au filtre "{filter}".
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </UpgradeGate>
  );
}
