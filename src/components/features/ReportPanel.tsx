import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  User,
  Plus,
  FileText,
  Loader2,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  Star,
} from 'lucide-react';
import type { GeoResult, Agency, Client } from '@/types';
import { generateReportPDF } from '@/lib/report-pdf';
import { addGeneratedReport } from '@/lib/report-storage';

/* ─── API helpers ──────────────────────────────────────────── */

async function fetchAgencies(userId: string): Promise<Agency[]> {
  const res = await fetch(`/api/agencies?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  return res.json();
}

async function searchClients(userId: string, query: string): Promise<Client[]> {
  const params = new URLSearchParams({ userId });
  if (query) params.set('search', query);
  const res = await fetch(`/api/clients?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

async function createClient(data: Omit<Client, '_id'>): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur création client');
  return res.json();
}

/* ─── Props ────────────────────────────────────────────────── */

interface ReportPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: GeoResult;
}

/* ─── Component ────────────────────────────────────────────── */

export default function ReportPanel({ open, onOpenChange, result }: ReportPanelProps) {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('none');

  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // New-client inline form
  const [addingClient, setAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  // Load agencies on open
  useEffect(() => {
    if (!open || !userId) return;
    fetchAgencies(userId).then((data) => {
      setAgencies(data);
      const def = data.find((a) => a.is_default);
      if (def?._id) setSelectedAgencyId(String(def._id));
    });
  }, [open, userId]);

  // Client search debounce
  useEffect(() => {
    if (clientDebounce.current) clearTimeout(clientDebounce.current);
    if (!open || !userId) return;
    clientDebounce.current = setTimeout(async () => {
      setClientSearching(true);
      const res = await searchClients(userId, clientQuery);
      setClientResults(res);
      setClientSearching(false);
      setShowClientDropdown(res.length > 0 || clientQuery.length > 0);
    }, 250);
    return () => {
      if (clientDebounce.current) clearTimeout(clientDebounce.current);
    };
  }, [clientQuery, open, userId]);

  // Close client dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(e.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(e.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectClient = (c: Client) => {
    setSelectedClient(c);
    setClientQuery(c.name);
    setShowClientDropdown(false);
    setAddingClient(false);
  };

  const clearClient = () => {
    setSelectedClient(null);
    setClientQuery('');
    setAddingClient(false);
  };

  const handleSaveNewClient = async () => {
    if (!newClientName.trim()) return;
    setSavingClient(true);
    try {
      const c = await createClient({
        user_id: userId,
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
        email: newClientEmail.trim() || undefined,
      });
      selectClient(c);
      setAddingClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
    } catch {
      // ignore
    } finally {
      setSavingClient(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setDone(false);
    try {
      const agency = agencies.find((a) => String(a._id) === selectedAgencyId) ?? null;
      await generateReportPDF(result, agency, selectedClient);
      addGeneratedReport({
        result,
        agencyName: agency?.name,
        clientName: selectedClient?.name,
      });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error('Report PDF error:', err);
    } finally {
      setGenerating(false);
    }
  }, [agencies, selectedAgencyId, selectedClient, result]);

  const selectedAgency = agencies.find((a) => String(a._id) === selectedAgencyId) ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Générer un rapport
          </SheetTitle>
          <SheetDescription>
            Configurez l'agence et le client, puis téléchargez le rapport PDF.
          </SheetDescription>
        </SheetHeader>

        {/* Parcel summary */}
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Parcelle</p>
          <p className="font-semibold text-emerald-900 leading-snug">
            {result.address || `${result.commune} — ${result.section} ${result.numero}`}
          </p>
          <p className="text-sm text-emerald-700 mt-0.5">{result.territoire}</p>
        </div>

        {/* ── Agency selector ── */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Agence
            </Label>
            <a
              href="/settings/agencies"
              className="text-xs text-emerald-600 hover:text-emerald-700 underline"
            >
              Gérer les agences
            </a>
          </div>

          {agencies.length === 0 ? (
            <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center">
              <p className="text-sm text-slate-500">Aucune agence configurée.</p>
              <a
                href="/settings/agencies"
                className="text-xs text-emerald-600 hover:underline mt-1 inline-block"
              >
                Créer une agence →
              </a>
            </div>
          ) : (
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une agence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-slate-500">Aucune agence</span>
                </SelectItem>
                {agencies.map((a) => (
                  <SelectItem key={String(a._id)} value={String(a._id)}>
                    <span className="flex items-center gap-2">
                      {a.name}
                      {a.is_default && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedAgency && (
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              {selectedAgency.logo_url ? (
                <img
                  src={selectedAgency.logo_url}
                  alt={selectedAgency.name}
                  className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
              )}
              <div className="text-sm min-w-0">
                <p className="font-medium text-slate-900">{selectedAgency.name}</p>
                {selectedAgency.address && (
                  <p className="text-xs text-slate-500 truncate">{selectedAgency.address}</p>
                )}
                {selectedAgency.phone && (
                  <p className="text-xs text-slate-500">{selectedAgency.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Client selector ── */}
        <div className="space-y-3 mb-8">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <User className="w-4 h-4 text-emerald-600" />
            Client
            <Badge variant="secondary" className="text-[10px] ml-1">Optionnel</Badge>
          </Label>

          {selectedClient ? (
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{selectedClient.name}</p>
                {selectedClient.phone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedClient.phone}
                  </p>
                )}
                {selectedClient.email && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedClient.email}
                  </p>
                )}
              </div>
              <button
                onClick={clearClient}
                className="text-xs text-slate-400 hover:text-slate-700 shrink-0"
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  ref={clientInputRef}
                  placeholder="Rechercher un client…"
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  onFocus={() => clientResults.length > 0 && setShowClientDropdown(true)}
                  className="pl-9"
                />
                {clientSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                )}
              </div>

              {showClientDropdown && clientResults.length > 0 && (
                <div
                  ref={clientDropdownRef}
                  className="border border-slate-200 rounded-md shadow-md bg-white max-h-48 overflow-y-auto z-50"
                >
                  {clientResults.map((c) => (
                    <button
                      key={String(c._id)}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-sm"
                      onClick={() => selectClient(c)}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.phone && (
                        <span className="text-xs text-slate-400 ml-2">{c.phone}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!addingClient && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => setAddingClient(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nouveau client
                </Button>
              )}

              {addingClient && (
                <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50 space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Nouveau client
                  </p>
                  <Input
                    placeholder="Nom complet *"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                  <Input
                    placeholder="Téléphone"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleSaveNewClient}
                      disabled={savingClient || !newClientName.trim()}
                    >
                      {savingClient ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Enregistrer'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setAddingClient(false); setNewClientName(''); setNewClientPhone(''); setNewClientEmail(''); }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Generate button ── */}
        <Button
          className={`w-full text-white text-base py-5 ${
            done
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
          }`}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Génération en cours…
            </>
          ) : done ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Rapport téléchargé !
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Générer le rapport PDF
            </>
          )}
        </Button>

        <p className="text-xs text-center text-slate-400 mt-3">
          Le rapport est généré localement et téléchargé directement dans votre navigateur.
        </p>
      </SheetContent>
    </Sheet>
  );
}
