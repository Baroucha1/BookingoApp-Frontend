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
import {
  Plus, Pencil, Trash2, Tag, BarChart2, User as UserIcon, Building, Loader2, Stamp, Plane, Hotel,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  promoCodesService,
  type PromoCode, type PromoCodeDetail, type PromoCodeInput, type PromoUsageRow,
  type DiscountType, type PromoRole, type PromoService,
} from '@/service/promoCodes.service';

// ── Form state (numbers kept as strings so fields can be left empty) ─────────

type Target = 'ALL' | PromoRole;

interface FormState {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  applicableTo: Target;
  appliesToVisa: boolean;
  appliesToFlight: boolean;
  appliesToHotel: boolean;
  minAmount: string;
  maxDiscount: string;
  maxUses: string;
  maxUsesPerUser: string;
  expiresAt: string;
  isActive: boolean;
}

const empty: FormState = {
  code: '', discountType: 'PERCENTAGE', discountValue: '10', applicableTo: 'CLIENT',
  appliesToVisa: true, appliesToFlight: true, appliesToHotel: true,
  minAmount: '', maxDiscount: '', maxUses: '', maxUsesPerUser: '1',
  expiresAt: '', isActive: true,
};

const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));

const toDateInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toInput = (f: FormState): PromoCodeInput => ({
  code:            f.code.trim().toUpperCase(),
  discountType:    f.discountType,
  discountValue:   Number(f.discountValue),
  applicableTo:    f.applicableTo === 'ALL' ? null : f.applicableTo,
  appliesToVisa:   f.appliesToVisa,
  appliesToFlight: f.appliesToFlight,
  appliesToHotel:  f.appliesToHotel,
  minAmount:       numOrNull(f.minAmount),
  maxDiscount:     f.discountType === 'PERCENTAGE' ? numOrNull(f.maxDiscount) : null,
  maxUses:         numOrNull(f.maxUses),
  maxUsesPerUser:  numOrNull(f.maxUsesPerUser),
  // valid until the end of the selected day
  expiresAt:       f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null,
  isActive:        f.isActive,
});

const fromPromo = (p: PromoCode): FormState => ({
  code:            p.code,
  discountType:    p.discountType,
  discountValue:   String(p.discountValue),
  applicableTo:    p.applicableTo ?? 'ALL',
  appliesToVisa:   p.appliesToVisa,
  appliesToFlight: p.appliesToFlight,
  appliesToHotel:  p.appliesToHotel,
  minAmount:       p.minAmount?.toString() ?? '',
  maxDiscount:     p.maxDiscount?.toString() ?? '',
  maxUses:         p.maxUses?.toString() ?? '',
  maxUsesPerUser:  p.maxUsesPerUser?.toString() ?? '',
  expiresAt:       toDateInput(p.expiresAt),
  isActive:        p.isActive,
});

// ── Display helpers ───────────────────────────────────────────────────────────

const formatDA = (n: number) => `${n.toLocaleString('fr-FR')} DA`;

const formatDiscount = (p: PromoCode) =>
    p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : formatDA(p.discountValue);

const TARGET_LABEL: Record<Target, string> = { ALL: 'Tous', CLIENT: 'Clients', AGENCY: 'Agences' };

const SERVICES = [
  { field: 'appliesToVisa',   label: 'Visa',  icon: Stamp },
  { field: 'appliesToFlight', label: 'Vol',   icon: Plane },
  { field: 'appliesToHotel',  label: 'Hôtel', icon: Hotel },
] as const;

const SERVICE_LABEL: Record<PromoService, string> = { VISA: 'Visa', FLIGHT: 'Vol', HOTEL: 'Hôtel' };

const USAGE_STATUS = {
  CONSUMED: { label: 'Utilisé',  className: 'bg-green-100 text-green-800 border-green-300' },
  RESERVED: { label: 'En cours', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  RELEASED: { label: 'Libéré',   className: 'text-muted-foreground' },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

const PromoCodesAdmin = () => {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [open, setOpen] = useState(false);

  const [usageFor, setUsageFor] = useState<PromoCode | null>(null);
  const [usageDetail, setUsageDetail] = useState<PromoCodeDetail | null>(null);
  const [usageRows, setUsageRows] = useState<PromoUsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageRoleFilter, setUsageRoleFilter] = useState<'all' | PromoRole>('all');

  const { toast } = useToast();

  const showError = (e: unknown) =>
      toast({ title: 'Erreur', description: (e as Error).message, variant: 'destructive' });

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
      setForm(f => ({ ...f, [field]: value }));

  useEffect(() => {
    promoCodesService.getAll()
        .then(setItems)
        .catch(showError)
        .finally(() => setLoading(false));
  }, []);

  const reset = () => { setForm(empty); setEditing(null); };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast({ title: 'Erreur', description: 'Code requis', variant: 'destructive' }); return;
    }
    if (!(Number(form.discountValue) > 0)) {
      toast({ title: 'Erreur', description: 'La valeur de réduction doit être supérieure à 0', variant: 'destructive' }); return;
    }
    if (!form.appliesToVisa && !form.appliesToFlight && !form.appliesToHotel) {
      toast({ title: 'Erreur', description: 'Sélectionnez au moins un service', variant: 'destructive' }); return;
    }

    setSaving(true);
    try {
      const payload = toInput(form);
      if (editing) {
        const updated = await promoCodesService.update(editing.id, payload);
        setItems(prev => prev.map(i => (i.id === editing.id ? updated : i)));
        toast({ title: 'Code promo mis à jour' });
      } else {
        const created = await promoCodesService.create(payload);
        setItems(prev => [created, ...prev]);
        toast({ title: 'Code promo créé' });
      }
      setOpen(false); reset();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (it: PromoCode) => {
    setForm(fromPromo(it));
    setEditing(it);
    setOpen(true);
  };

  const handleToggle = async (it: PromoCode) => {
    try {
      const updated = await promoCodesService.toggle(it.id);
      setItems(prev => prev.map(i => (i.id === it.id ? updated : i)));
    } catch (e) {
      showError(e);
    }
  };

  const handleDelete = async (it: PromoCode) => {
    if (!confirm(`Supprimer le code ${it.code} ?`)) return;
    try {
      await promoCodesService.remove(it.id);
      setItems(prev => prev.filter(i => i.id !== it.id));
      toast({ title: 'Code supprimé' });
    } catch (e) {
      showError(e); // 409 if already used → message tells the admin to deactivate instead
    }
  };

  const openUsage = async (it: PromoCode) => {
    setUsageFor(it);
    setUsageRoleFilter('all');
    setUsageDetail(null);
    setUsageRows([]);
    setUsageLoading(true);
    try {
      const [detail, rows] = await Promise.all([
        promoCodesService.getById(it.id),
        promoCodesService.getUsages(it.id),
      ]);
      setUsageDetail(detail);
      setUsageRows(rows);
    } catch (e) {
      showError(e);
    } finally {
      setUsageLoading(false);
    }
  };

  const isExpired = (iso: string | null) => !!iso && new Date(iso) < new Date();
  const isExhausted = (p: PromoCode) => p.maxUses !== null && p.usedCount >= p.maxUses;

  const filteredUsages = usageRows.filter(u => usageRoleFilter === 'all' || u.userType === usageRoleFilter);

  return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Codes promo</h1>
            <p className="text-sm text-muted-foreground mt-1">Réductions applicables aux visas, vols et hôtels</p>
          </div>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 me-2" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouveau'} code promo</DialogTitle></DialogHeader>
              <div className="space-y-5 mt-2">

                {/* Code + active */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Code</Label>
                    <Input
                        value={form.code}
                        onChange={e => set('code', e.target.value.toUpperCase())}
                        placeholder="SUMMER25"
                        className="font-mono"
                        maxLength={60}
                        disabled={!!editing && editing.usedCount > 0}
                    />
                    {editing && editing.usedCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Un code déjà utilisé ne peut pas être renommé</p>
                    )}
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <Switch id="promo-active" checked={form.isActive} onCheckedChange={v => set('isActive', v)} />
                    <Label htmlFor="promo-active">Actif</Label>
                  </div>
                </div>

                {/* Discount */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Type de réduction</Label>
                    <Select value={form.discountType} onValueChange={v => set('discountType', v as DiscountType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Montant fixe (DA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valeur {form.discountType === 'PERCENTAGE' ? '(%)' : '(DA)'}</Label>
                    <Input
                        type="number" min={0} max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                        value={form.discountValue}
                        onChange={e => set('discountValue', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Réduction max (DA)</Label>
                    <Input
                        type="number" min={0}
                        value={form.maxDiscount}
                        onChange={e => set('maxDiscount', e.target.value)}
                        placeholder="Illimitée"
                        disabled={form.discountType !== 'PERCENTAGE'}
                    />
                  </div>
                </div>

                {/* Services */}
                <div>
                  <Label>Services concernés</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {SERVICES.map(({ field, label, icon: Icon }) => (
                        <label
                            key={field}
                            className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox checked={form[field]} onCheckedChange={v => set(field, v === true)} />
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                    ))}
                  </div>
                </div>

                {/* Target + limits */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Applicable à</Label>
                    <Select value={form.applicableTo} onValueChange={v => set('applicableTo', v as Target)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLIENT">Clients</SelectItem>
                        <SelectItem value="AGENCY">Agences</SelectItem>
                        <SelectItem value="ALL">Tous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Utilisations max</Label>
                    <Input
                        type="number" min={editing?.usedCount || 1}
                        value={form.maxUses}
                        onChange={e => set('maxUses', e.target.value)}
                        placeholder="Illimitées"
                    />
                  </div>
                  <div>
                    <Label>Max par utilisateur</Label>
                    <Input
                        type="number" min={1}
                        value={form.maxUsesPerUser}
                        onChange={e => set('maxUsesPerUser', e.target.value)}
                        placeholder="Illimitées"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Montant minimum (DA)</Label>
                    <Input
                        type="number" min={0}
                        value={form.minAmount}
                        onChange={e => set('minAmount', e.target.value)}
                        placeholder="Aucun"
                    />
                  </div>
                  <div>
                    <Label>Expire le</Label>
                    <Input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Valable jusqu'à la fin de cette journée</p>
                  </div>
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {editing ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Table ── */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        <Loader2 className="w-5 h-5 animate-spin inline me-2" /> Chargement...
                      </TableCell>
                    </TableRow>
                ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun code promo</TableCell>
                    </TableRow>
                ) : (
                    items.map(it => {
                      const expired = isExpired(it.expiresAt);
                      const exhausted = isExhausted(it);
                      const live = it.isActive && !expired && !exhausted;
                      return (
                          <TableRow key={it.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-mono font-semibold">{it.code}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{formatDiscount(it)}</Badge>
                              {it.maxDiscount !== null && (
                                  <div className="text-xs text-muted-foreground mt-1">max {formatDA(it.maxDiscount)}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {SERVICES.filter(s => it[s.field]).map(({ field, label }) => (
                                    <Badge key={field} variant="outline" className="text-xs">{label}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{TARGET_LABEL[it.applicableTo ?? 'ALL']}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {it.usedCount} / {it.maxUses ?? '∞'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {it.expiresAt ? new Date(it.expiresAt).toLocaleDateString('fr-FR') : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch checked={it.isActive} onCheckedChange={() => handleToggle(it)} />
                                {live
                                    ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Actif</Badge>
                                    : expired
                                        ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Expiré</Badge>
                                        : exhausted
                                            ? <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Épuisé</Badge>
                                            : <Badge variant="outline" className="text-muted-foreground">Inactif</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-end">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openUsage(it)} title="Voir utilisations">
                                  <BarChart2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(it)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(it)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Usage dialog ── */}
        <Dialog open={!!usageFor} onOpenChange={(o) => { if (!o) setUsageFor(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Utilisations — <span className="font-mono">{usageFor?.code}</span></DialogTitle>
            </DialogHeader>

            {usageLoading ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline me-2" /> Chargement...
                </div>
            ) : (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-3 gap-3">
                    {(['CONSUMED', 'RESERVED', 'RELEASED'] as const).map(s => {
                      const stat = usageDetail?.usage[s];
                      return (
                          <div key={s} className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">{USAGE_STATUS[s].label}</div>
                            <div className="text-xl font-semibold">{stat?.count ?? 0}</div>
                            {s !== 'RELEASED' && (
                                <div className="text-xs text-muted-foreground">-{formatDA(stat?.totalDiscount ?? 0)}</div>
                            )}
                          </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{usageRows.length} utilisation(s) au total</p>
                    <Select value={usageRoleFilter} onValueChange={v => setUsageRoleFilter(v as typeof usageRoleFilter)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous rôles</SelectItem>
                        <SelectItem value="CLIENT">Clients</SelectItem>
                        <SelectItem value="AGENCY">Agences</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsages.map(u => {
                        const Icon = u.userType === 'AGENCY' ? Building : UserIcon;
                        return (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">{u.userName ?? 'Invité'}</div>
                                    {u.userEmail && <div className="text-xs text-muted-foreground">{u.userEmail}</div>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {u.service ? <Badge variant="outline">{SERVICE_LABEL[u.service]}</Badge> : '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">-{formatDA(u.discountApplied)}</Badge>
                                {u.originalAmount !== null && (
                                    <div className="text-xs text-muted-foreground mt-1">sur {formatDA(u.originalAmount)}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={USAGE_STATUS[u.status].className}>
                                  {USAGE_STATUS[u.status].label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(u.usedAt).toLocaleDateString('fr-FR')}
                              </TableCell>
                            </TableRow>
                        );
                      })}
                      {filteredUsages.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucune utilisation</TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default PromoCodesAdmin;