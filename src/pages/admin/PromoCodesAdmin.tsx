import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag, BarChart2, User as UserIcon, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedPromoCodes, seedPromoUsages, findClient, findAgency, type PromoCodeMock } from '@/lib/mockAdminData';

interface VisaOption { id: string; visa_type_name_fr: string; country_name_fr: string; }

const CURRENCIES = ['EUR', 'USD', 'DA', 'MAD', 'TND'];

const empty: Omit<PromoCodeMock, 'id' | 'usedCount'> = {
  code: '', discountType: 'percentage', value: 10, currency: 'EUR',
  applicableTo: 'all', maxUses: 100, expiresAt: '', isActive: true, visaTypeIds: [],
};

const PromoCodesAdmin = () => {
  const [items, setItems] = useState<PromoCodeMock[]>(seedPromoCodes);
  const [visaOptions, setVisaOptions] = useState<VisaOption[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [usageFor, setUsageFor] = useState<PromoCodeMock | null>(null);
  const [usageRoleFilter, setUsageRoleFilter] = useState<'all' | 'client' | 'agency'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/visa-types/options`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setVisaOptions(data); });
  }, []);

  const reset = () => { setForm(empty); setEditId(null); };

  const handleSave = () => {
    if (!form.code.trim()) { toast({ title: 'Erreur', description: 'Code requis', variant: 'destructive' }); return; }
    const normCode = form.code.trim().toUpperCase();
    if (items.some(i => i.code === normCode && i.id !== editId)) {
      toast({ title: 'Erreur', description: 'Ce code existe déjà', variant: 'destructive' }); return;
    }
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form, code: normCode } : i));
      toast({ title: 'Code promo mis à jour' });
    } else {
      setItems(prev => [...prev, { id: `pc-${crypto.randomUUID()}`, ...form, code: normCode, usedCount: 0 }]);
      toast({ title: 'Code promo créé' });
    }
    setOpen(false); reset();
  };

  const handleEdit = (it: PromoCodeMock) => {
    setForm({
      code: it.code, discountType: it.discountType, value: it.value, currency: it.currency,
      applicableTo: it.applicableTo, maxUses: it.maxUses,
      expiresAt: it.expiresAt ? it.expiresAt.slice(0, 10) : '',
      isActive: it.isActive, visaTypeIds: it.visaTypeIds,
    });
    setEditId(it.id); setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce code promo ?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Code supprimé' });
  };

  const toggleVisa = (id: string) => {
    setForm(f => ({
      ...f,
      visaTypeIds: f.visaTypeIds.includes(id) ? f.visaTypeIds.filter(v => v !== id) : [...f.visaTypeIds, id],
    }));
  };

  const isExpired = (iso: string) => iso && new Date(iso) < new Date();

  const formatDiscount = (it: PromoCodeMock) =>
    it.discountType === 'percentage' ? `${it.value}%` : `${it.value} ${it.currency}`;

  const applicableLabel = (a: PromoCodeMock['applicableTo']) =>
    ({ agency: 'Agences', client: 'Clients', all: 'Tous' }[a]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Codes promo</h1>
          <p className="text-sm text-muted-foreground mt-1">Réductions applicables aux types de visa</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 me-2" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Nouveau'} code promo</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className="font-mono" />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                  <Label>Actif</Label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Type de réduction</Label>
                  <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as PromoCodeMock['discountType'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valeur</Label>
                  <Input type="number" min={0} value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} />
                </div>
                <div>
                  <Label>Devise</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))} disabled={form.discountType === 'percentage'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Applicable à</Label>
                  <Select value={form.applicableTo} onValueChange={v => setForm(f => ({ ...f, applicableTo: v as PromoCodeMock['applicableTo'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="agency">Agences</SelectItem>
                      <SelectItem value="client">Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Utilisations max</Label>
                  <Input type="number" min={1} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: +e.target.value }))} />
                </div>
                <div>
                  <Label>Expire le</Label>
                  <Input type="date" value={form.expiresAt ? form.expiresAt.slice(0, 10) : ''} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value ? `${e.target.value}T00:00:00Z` : '' }))} />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Types de visa applicables</Label>
                  <span className="text-xs text-muted-foreground">{form.visaTypeIds.length === 0 ? 'Tous (aucun sélectionné)' : `${form.visaTypeIds.length} sélectionné(s)`}</span>
                </div>
                {visaOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun type de visa disponible</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                    {visaOptions.map(v => (
                      <label key={v.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={form.visaTypeIds.includes(v.id)} onCheckedChange={() => toggleVisa(v.id)} />
                        <span className="text-sm flex-1"><span className="font-medium">{v.country_name_fr}</span> — <span className="text-muted-foreground">{v.visa_type_name_fr}</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSave}>{editId ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Utilisation</TableHead>
                <TableHead>Expire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => {
                const expired = isExpired(it.expiresAt);
                const exhausted = it.usedCount >= it.maxUses;
                const live = it.isActive && !expired && !exhausted;
                return (
                  <TableRow key={it.id}>
                    <TableCell><div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-muted-foreground" /><span className="font-mono font-semibold">{it.code}</span></div></TableCell>
                    <TableCell><Badge variant="secondary">{formatDiscount(it)}</Badge></TableCell>
                    <TableCell className="text-sm">{applicableLabel(it.applicableTo)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{it.usedCount} / {it.maxUses}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{it.expiresAt ? new Date(it.expiresAt).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>
                      {live
                        ? <Badge className="bg-green-100 text-green-800 border-green-300" variant="outline">Actif</Badge>
                        : expired
                          ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Expiré</Badge>
                          : exhausted
                            ? <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Épuisé</Badge>
                            : <Badge variant="outline" className="text-muted-foreground">Inactif</Badge>}
                    </TableCell>
                    <TableCell className="text-end space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setUsageFor(it)} title="Voir utilisations"><BarChart2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(it)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun code promo</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!usageFor} onOpenChange={(o) => { if (!o) setUsageFor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Utilisations — <span className="font-mono">{usageFor?.code}</span></DialogTitle></DialogHeader>
          {usageFor && (() => {
            const all = seedPromoUsages.filter(u => u.promoCodeId === usageFor.id);
            const filtered = all.filter(u => usageRoleFilter === 'all' || u.userType === usageRoleFilter);
            return (
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{all.length} utilisation(s) au total</p>
                  <Select value={usageRoleFilter} onValueChange={(v) => setUsageRoleFilter(v as typeof usageRoleFilter)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous rôles</SelectItem>
                      <SelectItem value="client">Clients</SelectItem>
                      <SelectItem value="agency">Agences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Réduction</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(u => {
                      const owner = u.userType === 'client' ? findClient(u.userId) : findAgency(u.userId);
                      const name = owner ? ('fullName' in owner ? owner.fullName : owner.companyName) : u.userId;
                      const Icon = u.userType === 'client' ? UserIcon : Building;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">{name}</div>
                                <Badge variant="outline" className="text-[10px] h-4 mt-0.5">{u.userType === 'client' ? 'Client' : 'Agence'}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{u.paymentId}</TableCell>
                          <TableCell><Badge variant="secondary">-{u.discountApplied} {u.currency}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(u.date).toLocaleDateString('fr-FR')}</TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Aucune utilisation</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesAdmin;
