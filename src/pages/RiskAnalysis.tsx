import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Shield,
  Loader2,
  Droplets,
  Mountain,
  Flame,
  Waves,
  Zap,
  TrendingUp,
  Building2,
  Lightbulb,
  AlertTriangle,
  Crown,
  Brain,
  FileText,
} from 'lucide-react';
import type { RiskAnalysisResult } from '@/types';
import { CARIBBEAN_TERRITORIES } from '@/lib/territories';
import { useUserPlan } from '@/hooks/use-user-plan';
import {
  RiskScoreGauge,
  RiskBadge,
  MiniScoreBar,
  RiskDetailCard,
} from '@/components/features/RiskScoreComponents';
import { canAnalyze, incrementDailyAnalysis, getRemainingAnalyses } from '@/lib/usage-limits';

const API_BASE = '/api';

export default function RiskAnalysis() {
  const { plan } = useUserPlan();
  const [searchParams] = useSearchParams();

  // Form state – pre-fill from query params if coming from Dashboard
  const [commune, setCommune] = useState(searchParams.get('commune') || '');
  const [section, setSection] = useState(searchParams.get('section') || '');
  const [numero, setNumero] = useState(searchParams.get('numero') || '');
  const [territoire, setTerritoire] = useState(searchParams.get('territoire') || '971');
  const [surface, setSurface] = useState(searchParams.get('surface') || '');
  const [lat, setLat] = useState(searchParams.get('lat') || '');
  const [lng, setLng] = useState(searchParams.get('lng') || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [history, setHistory] = useState<RiskAnalysisResult[]>([]);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Load past analyses
  useEffect(() => {
    fetch(`${API_BASE}/risk-analysis`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {});
  }, []);

  const runAnalysis = async () => {
    if (!commune || !section || !numero) {
      setError('Veuillez remplir la commune, la section et le numéro de parcelle.');
      return;
    }

    // Check free-plan limit
    if (plan === 'free' && !canAnalyze('free')) {
      setShowLimitWarning(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowLimitWarning(false);

    try {
      const res = await fetch(`${API_BASE}/risk-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commune,
          section: section.toUpperCase(),
          numero,
          territoire,
          surface: surface || undefined,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          plan,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setShowLimitWarning(true);
        setError(data.error);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de l\'analyse.');
        return;
      }

      const data: RiskAnalysisResult = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev]);

      // Track usage for free plan
      if (plan === 'free') {
        incrementDailyAnalysis();
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const remaining = getRemainingAnalyses(plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Foncier Risk Score</h1>
              <p className="text-slate-500 text-sm">
                Analyse de risque foncier propulsée par l'IA
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
          <Brain className="w-3.5 h-3.5 mr-1" />
          IA
        </Badge>
      </div>

      {/* Free-plan limit warning */}
      {showLimitWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Limite d'analyses atteinte</p>
            <p className="text-sm text-amber-700 mt-1">
              Les utilisateurs du plan gratuit ont droit à 1 analyse par jour. Passez au plan Pro pour des analyses illimitées.
            </p>
            <Link to="/pricing">
              <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                <Crown className="w-4 h-4 mr-1" />
                Passer au Pro
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-emerald-600" />
                Parcelle à analyser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Territoire</Label>
                <Select value={territoire} onValueChange={setTerritoire}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARIBBEAN_TERRITORIES.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        <span className="flex items-center gap-2">
                          <span>{t.flag}</span>
                          <span>{t.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Commune</Label>
                <Input
                  placeholder="Ex : Pointe-à-Pitre"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input
                    placeholder="Ex : A"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>N° parcelle</Label>
                  <Input
                    placeholder="Ex : 123"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500">Surface (optionnel)</Label>
                <Input
                  placeholder="Ex : 500 m²"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-500">Latitude (opt.)</Label>
                  <Input
                    placeholder="16.2350"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500">Longitude (opt.)</Label>
                  <Input
                    placeholder="-61.5440"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>

              {error && !showLimitWarning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Lancer l'analyse IA
                  </>
                )}
              </Button>

              {plan === 'free' && (
                <p className="text-xs text-center text-slate-500">
                  {remaining > 0
                    ? `${remaining} analyse${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''} aujourd'hui`
                    : 'Aucune analyse restante aujourd\'hui'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Past analyses */}
          {history.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Analyses précédentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {history.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                      onClick={() => setResult(item)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {item.commune} {item.section} {item.numero}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <RiskBadge categorie={item.categorie} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Results */}
        <div className="xl:col-span-2 space-y-6">
          {loading && (
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                    <Brain className="w-8 h-8 text-emerald-600 absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900">Analyse IA en cours...</p>
                    <p className="text-sm text-slate-500 mt-1">
                      L'IA examine les données foncières, les risques naturels et le contexte urbanistique.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {[
                        'Zonage PLU',
                        'Risque inondation',
                        'Risque sismique',
                        'Loi Littoral',
                        'Servitudes',
                        'Marché foncier',
                      ].map((step) => (
                        <Badge key={step} variant="secondary" className="text-xs animate-pulse">
                          {step}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !result && (
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="text-center text-slate-500">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Aucune analyse en cours</p>
                  <p className="text-sm mt-1">
                    Remplissez les informations cadastrales et lancez une analyse pour obtenir votre rapport de risque foncier.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && result && (
            <>
              {/* Global score */}
              <Card className="shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <RiskScoreGauge score={result.scoreGlobal} size={140} />
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        <h2 className="text-xl font-bold text-white">Rapport de risque foncier</h2>
                        <RiskBadge categorie={result.categorie} />
                      </div>
                      <p className="text-slate-300 text-sm font-mono">
                        {result.parcelRef}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Analysé le {new Date(result.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Score overview mini bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.constructibilite && (
                  <MiniScoreBar
                    score={result.constructibilite.score}
                    label="Constructibilité"
                    icon={<Building2 className="w-4 h-4 text-slate-600" />}
                  />
                )}
                {result.risqueInondation && (
                  <MiniScoreBar
                    score={result.risqueInondation.score}
                    label="Inondation"
                    icon={<Droplets className="w-4 h-4 text-blue-600" />}
                  />
                )}
                {result.risqueSismique && (
                  <MiniScoreBar
                    score={result.risqueSismique.score}
                    label="Sismique"
                    icon={<Mountain className="w-4 h-4 text-amber-600" />}
                  />
                )}
                {result.risqueVolcanique && (
                  <MiniScoreBar
                    score={result.risqueVolcanique.score}
                    label="Volcanique"
                    icon={<Flame className="w-4 h-4 text-red-600" />}
                  />
                )}
                {result.loiLittoral && (
                  <MiniScoreBar
                    score={result.loiLittoral.score}
                    label="Loi Littoral"
                    icon={<Waves className="w-4 h-4 text-cyan-600" />}
                  />
                )}
                {result.servitudes && (
                  <MiniScoreBar
                    score={result.servitudes.score}
                    label="Servitudes"
                    icon={<Zap className="w-4 h-4 text-purple-600" />}
                  />
                )}
              </div>

              {/* AI Summary */}
              <Card className="shadow-sm border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Synthèse de l'IA</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {result.resumeIA}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed risk cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.constructibilite && (
                  <RiskDetailCard
                    title="Constructibilité & Zonage"
                    icon={<Building2 className="w-5 h-5 text-slate-600" />}
                    score={result.constructibilite.score}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Zone PLU :</span>
                        <span className="font-medium">{result.constructibilite.zonePLU}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">COS :</span>
                        <span className="font-medium">{result.constructibilite.cos}</span>
                      </div>
                      <p className="text-slate-600 mt-2">{result.constructibilite.commentaire}</p>
                    </div>
                  </RiskDetailCard>
                )}

                {result.risqueInondation && (
                  <RiskDetailCard
                    title="Risque d'inondation (PPRI)"
                    icon={<Droplets className="w-5 h-5 text-blue-600" />}
                    score={result.risqueInondation.score}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Zone PPRI :</span>
                        <span className="font-medium">{result.risqueInondation.zonePPRI}</span>
                      </div>
                      <p className="text-slate-600 mt-2">{result.risqueInondation.commentaire}</p>
                    </div>
                  </RiskDetailCard>
                )}

                {result.risqueSismique && (
                  <RiskDetailCard
                    title="Risque sismique"
                    icon={<Mountain className="w-5 h-5 text-amber-600" />}
                    score={result.risqueSismique.score}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aléa :</span>
                        <span className="font-medium">{result.risqueSismique.zoneAlea}</span>
                      </div>
                      <p className="text-slate-600 mt-2">{result.risqueSismique.commentaire}</p>
                    </div>
                  </RiskDetailCard>
                )}

                {result.risqueVolcanique && (
                  <RiskDetailCard
                    title="Risque volcanique"
                    icon={<Flame className="w-5 h-5 text-red-600" />}
                    score={result.risqueVolcanique.score}
                  >
                    <p className="text-slate-600">{result.risqueVolcanique.commentaire}</p>
                  </RiskDetailCard>
                )}

                {result.loiLittoral && (
                  <RiskDetailCard
                    title="Loi Littoral"
                    icon={<Waves className="w-5 h-5 text-cyan-600" />}
                    score={result.loiLittoral.score}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Applicable :</span>
                        <span className="font-medium">
                          {result.loiLittoral.applicable ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-2">{result.loiLittoral.commentaire}</p>
                    </div>
                  </RiskDetailCard>
                )}

                {result.servitudes && (
                  <RiskDetailCard
                    title="Servitudes"
                    icon={<Zap className="w-5 h-5 text-purple-600" />}
                    score={result.servitudes.score}
                  >
                    <div className="space-y-2">
                      {result.servitudes.types.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.servitudes.types.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-slate-600">{result.servitudes.commentaire}</p>
                    </div>
                  </RiskDetailCard>
                )}
              </div>

              {/* Market & Urbanism */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.marcheFoncier && (
                  <Card className="shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">Marché foncier</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-500">Prix moyen /m²</span>
                          <span className="text-lg font-bold text-slate-900">
                            {result.marcheFoncier.prixMoyenM2}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-500">Tendance</span>
                          <Badge
                            variant="secondary"
                            className={
                              result.marcheFoncier.tendance === 'HAUSSE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : result.marcheFoncier.tendance === 'BAISSE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-800'
                            }
                          >
                            {result.marcheFoncier.tendance === 'HAUSSE' && '↗ '}
                            {result.marcheFoncier.tendance === 'BAISSE' && '↘ '}
                            {result.marcheFoncier.tendance === 'STABLE' && '→ '}
                            {result.marcheFoncier.tendance}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{result.marcheFoncier.commentaire}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.urbanisme && (
                  <Card className="shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">Urbanisme</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                            Délai estimé permis de construire
                          </p>
                          <p className="font-semibold text-slate-900">
                            {result.urbanisme.tempsEstimePermis}
                          </p>
                        </div>
                        {result.urbanisme.projetsProches.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-medium mb-2">
                              Projets à proximité
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {result.urbanisme.projetsProches.map((p) => (
                                <Badge key={p} variant="outline" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-slate-600">{result.urbanisme.commentaire}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recommendations */}
              {result.recommandations.length > 0 && (
                <Card className="shadow-sm border-amber-200 bg-amber-50/50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-900">Recommandations</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.recommandations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-amber-700">{i + 1}</span>
                          </div>
                          <p className="text-sm text-slate-700">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Ce rapport est généré par intelligence artificielle à titre informatif uniquement. 
                  Les scores et analyses sont basés sur des données publiques et des estimations. 
                  Pour toute décision d'investissement, consultez un professionnel qualifié 
                  (notaire, géomètre, urbaniste). CadaStreMap ne saurait être tenu responsable 
                  des décisions prises sur la base de ce rapport.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
