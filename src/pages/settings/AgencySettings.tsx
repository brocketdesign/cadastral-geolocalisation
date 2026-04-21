import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { Agency } from '@/types';
import UpgradeGate from '@/components/features/UpgradeGate';

/* ─── API helpers ───────────────────────────────────────────── */

async function fetchAgencies(userId: string): Promise<Agency[]> {
  const res = await fetch(`/api/agencies?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  return res.json();
}

async function createAgency(data: Omit<Agency, '_id'>): Promise<Agency> {
  const res = await fetch('/api/agencies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur lors de la création');
  return res.json();
}

async function updateAgency(data: Agency): Promise<Agency> {
  const res = await fetch('/api/agencies', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur lors de la mise à jour');
  return res.json();
}

async function deleteAgency(id: string, userId: string): Promise<void> {
  const res = await fetch(`/api/agencies?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erreur lors de la suppression');
}

/* ─── Empty form ────────────────────────────────────────────── */

const emptyForm = (): Omit<Agency, '_id'> => ({
  user_id: '',
  name: '',
  address: '',
  phone: '',
  logo_url: '',
  is_default: false,
});

/* ─── Component ─────────────────────────────────────────────── */

export default function AgencySettings() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Agency | null>(null);
  const [form, setForm] = useState<Omit<Agency, '_id'>>(emptyForm());
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await fetchAgencies(userId);
    setAgencies(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm(), user_id: userId });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (agency: Agency) => {
    setEditTarget(agency);
    setForm({
      user_id: agency.user_id,
      name: agency.name,
      address: agency.address,
      phone: agency.phone,
      logo_url: agency.logo_url ?? '',
      is_default: agency.is_default,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const saveForm = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom de l\'agence est obligatoire.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editTarget && editTarget._id) {
        const updated = await updateAgency({ ...form, _id: editTarget._id });
        setSavedId(String(updated._id));
        setTimeout(() => setSavedId(null), 2000);
      } else {
        const created = await createAgency(form);
        setSavedId(String(created._id));
        setTimeout(() => setSavedId(null), 2000);
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (agency: Agency) => {
    if (!agency._id) return;
    await updateAgency({ ...agency, is_default: true });
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    await deleteAgency(String(deleteTarget._id), userId);
    setDeleteTarget(null);
    await load();
  };

  return (
    <UpgradeGate
      requiredPlan="pro"
      featureLabel="La gestion des agences est réservée au plan Pro. Passez au Pro pour gérer vos agences et les inclure dans vos rapports PDF."
      blurContent
    >
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes agences</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gérez vos agences. L'agence par défaut est pré-sélectionnée à chaque nouveau rapport.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle agence
        </Button>
      </div>

      {/* Agency list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement…
        </div>
      ) : agencies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Aucune agence créée</p>
            <p className="text-slate-400 text-sm mt-1">
              Créez votre première agence pour l'inclure dans vos rapports PDF.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une agence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agencies.map((agency) => (
            <Card
              key={String(agency._id)}
              className={`transition-shadow ${
                String(agency._id) === savedId ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Logo preview or initial */}
                  <div className="shrink-0">
                    {agency.logo_url ? (
                      <img
                        src={agency.logo_url}
                        alt={agency.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{agency.name}</h3>
                      {agency.is_default && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                          Par défaut
                        </Badge>
                      )}
                    </div>
                    {agency.address && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {agency.address}
                      </p>
                    )}
                    {agency.phone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {agency.phone}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!agency.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefault(agency)}
                        title="Définir par défaut"
                        className="text-slate-400 hover:text-amber-500"
                      >
                        <StarOff className="w-4 h-4" />
                      </Button>
                    )}
                    {agency.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="text-amber-500"
                        title="Agence par défaut"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(agency)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(agency)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'Modifier l\'agence' : 'Nouvelle agence'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ag-name">Nom de l'agence *</Label>
              <Input
                id="ag-name"
                placeholder="Immobilier Antilles, Cabinet Dupont…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-address">Adresse</Label>
              <Input
                id="ag-address"
                placeholder="12 rue de la République, 97100 Basse-Terre"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-phone">Téléphone</Label>
              <Input
                id="ag-phone"
                placeholder="+590 590 12 34 56"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-logo">URL du logo</Label>
              <Input
                id="ag-logo"
                placeholder="https://example.com/logo.png"
                value={form.logo_url ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              />
              <p className="text-xs text-slate-500">
                Lien direct vers votre logo (hébergé sur votre site ou Cloudinary).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ag-default"
                type="checkbox"
                className="rounded"
                checked={form.is_default}
                onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
              />
              <Label htmlFor="ag-default" className="cursor-pointer">
                Définir comme agence par défaut
              </Label>
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={saveForm}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {editTarget ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'agence</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </UpgradeGate>
  );
}
