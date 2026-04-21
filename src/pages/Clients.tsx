import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  UserRound,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  FileText,
  Loader2,
  Search,
  CheckCircle2,
} from 'lucide-react';
import type { Client } from '@/types';
import UpgradeGate from '@/components/features/UpgradeGate';

/* ─── API helpers ───────────────────────────────────────────── */

async function fetchClients(userId: string, query?: string): Promise<Client[]> {
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
  if (!res.ok) throw new Error('Erreur lors de la création');
  return res.json();
}

async function updateClient(data: Client): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erreur lors de la mise à jour');
  return res.json();
}

async function deleteClient(id: string, userId: string): Promise<void> {
  const res = await fetch(
    `/api/clients?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error('Erreur lors de la suppression');
}

/* ─── Empty form ─────────────────────────────────────────────── */

const emptyForm = (): Omit<Client, '_id'> => ({
  user_id: '',
  name: '',
  phone: '',
  email: '',
  notes: '',
});

/* ─── Component ─────────────────────────────────────────────── */

export default function ClientsPage() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, '_id'>>(emptyForm());
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await fetchClients(userId, searchQuery);
    setClients(data);
    setLoading(false);
  }, [userId, searchQuery]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm(), user_id: userId });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditTarget(client);
    setForm({
      user_id: client.user_id,
      name: client.name,
      phone: client.phone ?? '',
      email: client.email ?? '',
      notes: client.notes ?? '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const saveForm = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom du client est obligatoire.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editTarget && editTarget._id) {
        const updated = await updateClient({ ...form, _id: editTarget._id });
        setSavedId(String(updated._id));
        setTimeout(() => setSavedId(null), 2000);
      } else {
        const created = await createClient(form);
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

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    await deleteClient(String(deleteTarget._id), userId);
    setDeleteTarget(null);
    await load();
  };

  return (
    <UpgradeGate
      requiredPlan="pro"
      featureLabel="La gestion des clients est réservée au plan Pro. Passez au Pro pour gérer votre carnet de clients et les attacher à vos rapports."
      blurContent
    >
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes clients</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gérez votre carnet de clients pour les attacher à vos rapports.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher un client…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement…
        </div>
      ) : clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserRound className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery
                ? 'Essayez un autre nom.'
                : "Créez votre premier client pour l'inclure dans vos rapports PDF."}
            </p>
            {!searchQuery && (
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card
              key={String(client._id)}
              className={`transition-shadow ${
                String(client._id) === savedId ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <UserRound className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{client.name}</p>
                    <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                      {client.phone && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {client.email}
                        </span>
                      )}
                    </div>
                    {client.notes && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {client.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(client)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(client)}
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
              {editTarget ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cl-name">Nom complet *</Label>
              <Input
                id="cl-name"
                placeholder="Jean Dupont"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-phone">Téléphone</Label>
              <Input
                id="cl-phone"
                placeholder="+590 690 12 34 56"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-email">Email</Label>
              <Input
                id="cl-email"
                type="email"
                placeholder="jean.dupont@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-notes">Notes</Label>
              <Input
                id="cl-notes"
                placeholder="Notes libres…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
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
            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
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
