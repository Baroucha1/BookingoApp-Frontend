import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, ShieldCheck, Building, User as UserIcon, UserCog, Search, ArrowRight, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('token');
const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers ?? {}) } });

// ── Types ──────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'AGENCY' | 'CLIENT';
  isActive: boolean;
  createdAt: string;
  admin:   null | Record<string, unknown>;
  agency:  null | { id: string; companyName: string; taxId: string | null; isVerified: boolean; groupId: string | null };
  client:  null | { id: string; isVerified: boolean };
}
interface AgencyGroup { id: string; name: string; }

// ── Component ──────────────────────────────────────────────────────────────
const UsersAdmin = () => {
  const { toast } = useToast();

  const [users,  setUsers]  = useState<UserRow[]>([]);
  const [groups, setGroups] = useState<AgencyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Modals ──
  const [adminOpen, setAdminOpen]             = useState(false);
  const [adminForm, setAdminForm]             = useState({ email: '', phone: '', password: '', name: '', lastname: '' });
  const [adminSaving, setAdminSaving]         = useState(false);

  const [wizardOpen, setWizardOpen]           = useState(false);
  const [wizardStep, setWizardStep]           = useState<1 | 2>(1);
  const [clientSearch, setClientSearch]       = useState('');
  const [pickedClient, setPickedClient]       = useState<UserRow | null>(null);
  const [agencyForm, setAgencyForm]           = useState({ companyName: '', taxId: '', isVerified: false, groupId: '' });
  const [wizardSaving, setWizardSaving]       = useState(false);

  // ── Promote to admin: track which user id is currently being promoted ──
  const [promotingId, setPromotingId]         = useState<string | null>(null);

  const [detailUser, setDetailUser]           = useState<UserRow | null>(null);

  // ── Fetch all users ──
  const load = async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/admin/users');
      const data = await res.json();
      if (data.status === 'success') setUsers(data.data);
    } catch { toast({ title: 'Erreur chargement', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);



  // ── Derived lists ──
  const admins   = useMemo(() => users.filter(u => u.role === 'ADMIN'),   [users]);
  const agencies = useMemo(() => users.filter(u => u.role === 'AGENCY'),  [users]);
  const clients  = useMemo(() => users.filter(u => u.role === 'CLIENT'),  [users]);

  const stats = useMemo(() => ({
    admins:            admins.length,
    agencies:          agencies.length,
    agenciesVerified:  agencies.filter(a => a.agency?.isVerified).length,
    clients:           clients.length,
    clientsVerified:   clients.filter(c => c.client?.isVerified).length,
  }), [admins, agencies, clients]);

  // ── Patch helper ──
  const patch = async (id: string, body: object) => {
    const res  = await authFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    const data = await res.json();
    if (data.status === 'success') {
      setUsers(prev => prev.map(u => u.id === id ? data.data : u));
    } else {
      toast({ title: 'Erreur', description: data.message, variant: 'destructive' });
    }
  };

  // ── Delete ──
  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const res  = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      setUsers(prev => prev.filter(u => u.id !== id));
      toast({ title: 'Utilisateur supprimé' });
    } else {
      toast({ title: 'Erreur', description: data.message, variant: 'destructive' });
    }
  };

  // ── Create admin ──
  const createAdmin = async () => {
    if (!adminForm.email || !adminForm.password || !adminForm.name || !adminForm.lastname) {
      toast({ title: 'Email, prénom, nom et mot de passe requis', variant: 'destructive' }); return;
    }
    setAdminSaving(true);
    const res  = await authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(adminForm) });
    const data = await res.json();
    setAdminSaving(false);
    if (data.status === 'success') {
      setUsers(prev => [data.data, ...prev]);
      setAdminForm({ email: '', phone: '', password: '', name: '', lastname: '' });
      setAdminOpen(false);
      toast({ title: 'Admin créé' });
    } else {
      toast({ title: 'Erreur', description: data.message, variant: 'destructive' });
    }
  };

  // ── Convert to agency ──
  const convertToAgency = async () => {
    if (!pickedClient || !agencyForm.companyName.trim()) {
      toast({ title: 'Nom de société requis', variant: 'destructive' }); return;
    }
    setWizardSaving(true);
    const res  = await authFetch(`/api/admin/users/${pickedClient.id}/convert-to-agency`, {
      method: 'POST',
      body:   JSON.stringify(agencyForm),
    });
    const data = await res.json();
    setWizardSaving(false);
    if (data.status === 'success') {
      setUsers(prev => prev.map(u => u.id === pickedClient.id ? data.data : u));
      setWizardOpen(false);
      toast({ title: 'Client converti en agence', description: `${pickedClient.email} → ${agencyForm.companyName}` });
    } else {
      toast({ title: 'Erreur', description: data.message, variant: 'destructive' });
    }
  };

  // ── Convert (promote) client to admin ──
  const promoteToAdmin = async (u: UserRow) => {
    if (!confirm(`Promouvoir ${u.email} en administrateur ? Cette action est irréversible et supprimera son profil client.`)) return;
    setPromotingId(u.id);
    const res  = await authFetch(`/api/admin/users/${u.id}/convert-to-admin`, { method: 'POST' });
    const data = await res.json();
    setPromotingId(null);
    if (data.status === 'success') {
      setUsers(prev => prev.map(x => x.id === u.id ? data.data : x));
      toast({ title: 'Utilisateur promu admin', description: u.email });
    } else {
      toast({ title: 'Erreur', description: data.message, variant: 'destructive' });
    }
  };

  const openWizard = () => {
    setWizardStep(1); setPickedClient(null); setClientSearch('');
    setAgencyForm({ companyName: '', taxId: '', isVerified: false, groupId: '' });
    setWizardOpen(true);
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return clients.filter(c => !q || c.email.toLowerCase().includes(q) || (c.phone || '').includes(q));
  }, [clients, clientSearch]);

  if (loading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
  );

  return (
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Utilisateurs &amp; rôles</h1>
            <p className="text-sm text-muted-foreground mt-1">Administrateurs, agences et clients</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" />
            <div><p className="text-xs text-muted-foreground uppercase">Admins</p><p className="text-2xl font-bold">{stats.admins}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Building className="w-8 h-8 text-primary" />
            <div><p className="text-xs text-muted-foreground uppercase">Agences</p>
              <p className="text-2xl font-bold">{stats.agencies} <span className="text-xs text-muted-foreground font-normal">({stats.agenciesVerified} vérifiées)</span></p>
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <UserIcon className="w-8 h-8 text-primary" />
            <div><p className="text-xs text-muted-foreground uppercase">Clients</p>
              <p className="text-2xl font-bold">{stats.clients} <span className="text-xs text-muted-foreground font-normal">({stats.clientsVerified} vérifiés)</span></p>
            </div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="admins">
          <TabsList>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="agencies">Agences</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>

          {/* ── ADMINS ── */}
          <TabsContent value="admins" className="mt-4">
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{admins.length} administrateurs</p>
                <Button size="sm" onClick={() => setAdminOpen(true)}><Plus className="w-4 h-4 me-2" /> Ajouter admin</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Email</TableHead><TableHead>Téléphone</TableHead><TableHead>Créé le</TableHead><TableHead>Actif</TableHead><TableHead className="text-end">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.phone || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell><Switch checked={a.isActive} onCheckedChange={v => patch(a.id, { isActive: v })} /></TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" onClick={() => setDetailUser(a)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteUser(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          {/* ── AGENCIES ── */}
          <TabsContent value="agencies" className="mt-4">
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{agencies.length} agences</p>
                <Button size="sm" onClick={openWizard}><Plus className="w-4 h-4 me-2" /> Convertir un client</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Société</TableHead><TableHead>Email</TableHead><TableHead>Tél</TableHead><TableHead>Groupe</TableHead><TableHead>Vérifiée</TableHead><TableHead>Inscrite</TableHead><TableHead /></TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" />{a.agency?.companyName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.phone || '—'}</TableCell>
                        <TableCell>
                          <Select value={a.agency?.groupId ?? 'none'} onValueChange={v => patch(a.id, { groupId: v === 'none' ? null : v })}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun</SelectItem>
                              {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={a.agency?.isVerified ?? false} onCheckedChange={v => patch(a.id, { isVerified: v })} />
                            {a.agency?.isVerified && <ShieldCheck className="w-4 h-4 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" onClick={() => setDetailUser(a)}><Eye className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          {/* ── CLIENTS ── */}
          <TabsContent value="clients" className="mt-4">
            <Card><CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Email</TableHead><TableHead>Tél</TableHead><TableHead>Vérifié</TableHead><TableHead>Inscrit</TableHead><TableHead className="text-end">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" />{c.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.phone || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={c.client?.isVerified ?? false} onCheckedChange={v => patch(c.id, { isVerified: v })} />
                            {c.client?.isVerified && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Vérifié</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-end">
                          {c.client?.isVerified && (
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Promouvoir en admin"
                                  disabled={promotingId === c.id}
                                  onClick={() => promoteToAdmin(c)}
                              >
                                {promotingId === c.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <UserCog className="w-4 h-4 text-blue-600" />}
                              </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setDetailUser(c)}><Eye className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* ── Create admin modal ── */}
        <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvel administrateur</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label>Email *</Label><Input type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prénom *</Label><Input value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Nom *</Label><Input value={adminForm.lastname} onChange={e => setAdminForm(f => ({ ...f, lastname: e.target.value }))} /></div>
              </div>
              <div><Label>Téléphone</Label><Input value={adminForm.phone} onChange={e => setAdminForm(f => ({ ...f, phone: e.target.value }))} placeholder="+213 ..." /></div>
              <div><Label>Mot de passe *</Label><Input type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} /></div>
              <Button className="w-full" onClick={createAdmin} disabled={adminSaving}>
                {adminSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</> : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Convert to agency wizard ── */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{wizardStep === 1 ? 'Étape 1 — Choisir un client' : 'Étape 2 — Informations agence'}</DialogTitle>
            </DialogHeader>

            {wizardStep === 1 && (
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-2 rounded-md border px-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input className="border-0 focus-visible:ring-0" placeholder="Rechercher par email ou téléphone..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {filteredClients.length === 0 && <p className="text-sm text-center text-muted-foreground py-6">Aucun client</p>}
                    {filteredClients.map(c => (
                        <button key={c.id} type="button" onClick={() => { setPickedClient(c); setAgencyForm(f => ({ ...f, companyName: c.email.split('@')[0] })); setWizardStep(2); }}
                                className="w-full text-start rounded-md border bg-card p-3 hover:bg-muted/50 transition flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{c.email}</p>
                            <p className="text-xs text-muted-foreground">{c.phone || '—'}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                    ))}
                  </div>
                </div>
            )}

            {wizardStep === 2 && pickedClient && (
                <div className="space-y-4 mt-2">
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">{pickedClient.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">→ Sera converti en <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">AGENCY</Badge></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Nom de la société *</Label><Input value={agencyForm.companyName} onChange={e => setAgencyForm(f => ({ ...f, companyName: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Tax ID / NIF</Label><Input value={agencyForm.taxId} onChange={e => setAgencyForm(f => ({ ...f, taxId: e.target.value }))} placeholder="NIF-..." /></div>
                    <div>
                      <Label>Groupe</Label>
                      <Select value={agencyForm.groupId || 'none'} onValueChange={v => setAgencyForm(f => ({ ...f, groupId: v === 'none' ? '' : v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Switch checked={agencyForm.isVerified} onCheckedChange={v => setAgencyForm(f => ({ ...f, isVerified: v }))} />
                      <Label className="mb-2">Vérifiée</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setWizardStep(1)}>Retour</Button>
                    <Button className="flex-1" onClick={convertToAgency} disabled={wizardSaving}>
                      {wizardSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conversion...</> : 'Convertir en agence'}
                    </Button>
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Detail modal (simple) ── */}
        <Dialog open={!!detailUser} onOpenChange={o => { if (!o) setDetailUser(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Détails utilisateur</DialogTitle></DialogHeader>
            {detailUser && (
                <div className="space-y-3 mt-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-muted-foreground">ID</p><p className="font-mono text-xs">{detailUser.id}</p></div>
                    <div><p className="text-muted-foreground">Rôle</p><Badge>{detailUser.role}</Badge></div>
                    <div><p className="text-muted-foreground">Email</p><p>{detailUser.email}</p></div>
                    <div><p className="text-muted-foreground">Téléphone</p><p>{detailUser.phone || '—'}</p></div>
                    <div><p className="text-muted-foreground">Actif</p><p>{detailUser.isActive ? 'Oui' : 'Non'}</p></div>
                    <div><p className="text-muted-foreground">Inscrit le</p><p>{new Date(detailUser.createdAt).toLocaleDateString('fr-FR')}</p></div>
                  </div>
                  {detailUser.agency && (
                      <div className="border-t pt-3 space-y-1">
                        <p className="font-semibold">Agence</p>
                        <p>Société: {detailUser.agency.companyName}</p>
                        {detailUser.agency.taxId && <p>NIF: {detailUser.agency.taxId}</p>}
                        <p>Vérifiée: {detailUser.agency.isVerified ? 'Oui' : 'Non'}</p>
                      </div>
                  )}
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default UsersAdmin;