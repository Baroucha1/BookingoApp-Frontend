import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  VisaType, DocumentType, CountryOption,
  getAllVisaTypes, getCountries, getDocumentTypes,
  createVisaType, updateVisaType, removeVisaType,
  type RequirementPayload,
} from '../../service/visaType.service.ts';
import {EntryType, VisaCategory} from "@/lib/enums.ts";

// ── Constants ─────────────────────────────────────────────────────────────────
const VISA_CATEGORIES = [
  { value: VisaCategory.E_VISA_TOURISM, label: 'eVisa Tourisme' },
  { value: VisaCategory.CLASSIC_VISA,   label: 'visa classique' },
  { value: VisaCategory.EXTENSION_VISA, label: 'Extension'      },
];

const ENTRY_TYPES = [
  { value: EntryType.SINGLE_ENTRY,   label: 'Entrée simple'    },
  { value: EntryType.MULTIPLE_ENTRY, label: 'Entrées multiples' },
];

const CURRENCIES   = ['DZD', 'EUR', 'USD', 'MAD', 'TND'];
const AGENCY_GROUPS = ['A', 'B', 'Premium'] as const;
type AgencyGroup   = typeof AGENCY_GROUPS[number];
type AgencyPricing = Record<AgencyGroup, string>;

// ── Types ─────────────────────────────────────────────────────────────────────
type ExtRequirement = RequirementPayload & { notesFr: string; notesEn: string; notesAr: string };

const emptyExtReq = (documentTypeId: string): ExtRequirement => ({
  documentTypeId,
  isRequired:   true,
  allowsUpload: true,
  notesFr:      '',
  notesEn:      '',
  notesAr:      '',
});

// ── Default form ──────────────────────────────────────────────────────────────
const emptyForm = {
  countryId:       '' as string,
  nameFr:          'eVisa Tourisme',
  nameEn:          'Tourism eVisa',
  nameAr:          'تأشيرة سياحية إلكترونية',
  price:           0,
  currency:        'DA',
  duration:        30,
  processingDelay: 3,
  isActive:        true,
  descriptionFr:   '',
  descriptionEn:   '',
  descriptionAr:   '',
  requirements:    [] as ExtRequirement[],
  category:  VisaCategory.E_VISA_TOURISM as String,
  entryType: EntryType.SINGLE_ENTRY as String,
  agency_pricing:  { A: '', B: '', Premium: '' } as AgencyPricing,
};



// ── Component ─────────────────────────────────────────────────────────────────
const VisaTypesAdmin = () => {

  const [visaTypes,     setVisaTypes]     = useState<VisaType[]>([]);
  const [countries,     setCountries]     = useState<CountryOption[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [form,          setForm]          = useState(emptyForm);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const { toast } = useToast();

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [vts, cs] = await Promise.all([getAllVisaTypes(), getCountries()]);
      setVisaTypes(vts);
      setCountries(cs);
    } catch (err) {
      console.error('load() failed:', err);
      toast({ title: 'Erreur de chargement', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
    // document types are only needed when the modal opens — non-blocking
    getDocumentTypes()
        .then(setDocumentTypes)
        .catch(err => console.error('document-types failed:', err));
  };

  useEffect(() => { load(); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectCountry = (countryId: string) =>
      setForm(f => ({ ...f, countryId }));

  const handleSave = async () => {
    if (!form.countryId) {
      toast({ title: 'Erreur', description: 'Sélectionnez un pays', variant: 'destructive' });
      return;
    }
    const payload = {
      countryId:       form.countryId,
      nameFr:          form.nameFr,
      nameEn:          form.nameEn,
      nameAr:          form.nameAr,
      price:           form.price,
      currency:        form.currency,
      duration:        form.duration,
      processingDelay: form.processingDelay,
      isActive:        form.isActive,
      descriptionFr:   form.descriptionFr  || null,
      descriptionEn:   form.descriptionEn  || null,
      descriptionAr:   form.descriptionAr  || null,
      category:        form.category,
      entryType:       form.entryType,
      requirements:    form.requirements,
    };

    try {
      setLoading(true);
      if (editId) {
        await updateVisaType(editId, payload);
        toast({ title: 'Type de visa mis à jour' });
      } else {
        await createVisaType(payload);
        toast({ title: 'Type de visa créé' });
      }
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vt: VisaType) => {
    setForm({
      countryId:       vt.country.id,
      nameFr:          vt.nameFr,
      nameEn:          vt.nameEn,
      nameAr:          vt.nameAr,
      price:           vt.price,
      currency:        vt.currency,
      duration:        vt.duration,
      processingDelay: vt.processingDelay,
      isActive:        vt.isActive,
      descriptionFr:   vt.descriptionFr ?? '',
      descriptionEn:   vt.descriptionEn ?? '',
      descriptionAr:   vt.descriptionAr ?? '',
      requirements:    vt.documentRequirements.map(r => ({
        documentTypeId: r.documentTypeId,
        isRequired:     r.isRequired,
        allowsUpload:   r.allowsUpload,
        notesFr:        r.notesFr ?? '',
        notesEn:        r.notesEn ?? '',
        notesAr:        r.notesAr ?? '',
      })),
      category:       vt.category  ?? VisaCategory.E_VISA_TOURISM,
      entryType:      vt.entryType ?? EntryType.SINGLE_ENTRY,
      agency_pricing: { A: '', B: '', Premium: '' },
    });
    setEditId(vt.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce type de visa ?')) return;
    try {
      setLoading(true);
      await removeVisaType(id);
      toast({ title: 'Type de visa supprimé' });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRequirement = (documentTypeId: string) => {
    setForm(f => {
      const exists = f.requirements.find(r => r.documentTypeId === documentTypeId);
      return exists
          ? { ...f, requirements: f.requirements.filter(r => r.documentTypeId !== documentTypeId) }
          : { ...f, requirements: [...f.requirements, emptyExtReq(documentTypeId)] };
    });
  };

  const updateRequirement = (documentTypeId: string, patch: Partial<ExtRequirement>) => {
    setForm(f => ({
      ...f,
      requirements: f.requirements.map(r =>
          r.documentTypeId === documentTypeId ? { ...r, ...patch } : r,
      ),
    }));
  };

  const updateAgencyPrice = (group: AgencyGroup, value: string) =>
      setForm(f => ({ ...f, agency_pricing: { ...f.agency_pricing, [group]: value } }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
      <>


        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Types de visa</h1>

            <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 me-2" /> Ajouter</Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? 'Modifier' : 'Nouveau'} type de visa</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="basic">Infos</TabsTrigger>
                    <TabsTrigger value="pricing">Tarifs</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="conditions">Conditions</TabsTrigger>
                  </TabsList>

                  {/* ── Infos ── */}
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div>
                      <Label>Pays</Label>
                      {countries.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            Aucun pays disponible.{' '}
                            <Link to="/assets/admin/countries" className="text-primary underline">Ajoutez un pays</Link> d'abord.
                          </p>
                      ) : (
                          <Select value={form.countryId} onValueChange={handleSelectCountry}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez un pays" /></SelectTrigger>
                            <SelectContent>
                              {countries.map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                              <span className="inline-flex items-center gap-2">
                                <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt="" className="w-5 h-3 object-cover rounded-sm" />
                                {c.nameFr} <span className="text-xs text-muted-foreground">({c.code.toUpperCase()})</span>
                              </span>
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Catégorie</Label>
                        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {VISA_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type d'entrée</Label>
                        <Select value={form.entryType} onValueChange={v => setForm(f => ({ ...f, entryType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ENTRY_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-2">Nom du type de visa</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>FR</Label><Input value={form.nameFr} onChange={e => setForm(f => ({ ...f, nameFr: e.target.value }))} /></div>
                        <div><Label>EN</Label><Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} /></div>
                        <div className="col-span-2"><Label>AR</Label><Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" /></div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <p className="text-sm font-semibold">Description</p>
                      <div><Label>FR</Label><Textarea rows={2} value={form.descriptionFr} onChange={e => setForm(f => ({ ...f, descriptionFr: e.target.value }))} /></div>
                      <div><Label>EN</Label><Textarea rows={2} value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))} /></div>
                      <div><Label>AR</Label><Textarea rows={2} value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} dir="rtl" /></div>
                    </div>

                    <div className="flex items-center gap-2 border-t pt-4">
                      <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                      <Label>Type de visa actif</Label>
                    </div>
                  </TabsContent>

                  {/* ── PRICING ── */}
                  <TabsContent value="pricing" className="space-y-5 mt-4">
                    <div>
                      <p className="text-sm font-semibold mb-3">Tarif de base</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Prix</Label>
                          <Input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
                        </div>
                        <div>
                          <Label>Devise</Label>
                          <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">Tarifs agences</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Info className="w-3 h-3" /> Si vide, le tarif de base ({form.price} {form.currency}) s'applique
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">UI seulement</Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Groupe</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Devise</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {AGENCY_GROUPS.map(group => (
                              <TableRow key={group}>
                                <TableCell><Badge variant="secondary">{group}</Badge></TableCell>
                                <TableCell>
                                  <Input type="number" min={0} placeholder={`${form.price}`}
                                         value={form.agency_pricing[group]}
                                         onChange={e => updateAgencyPrice(group, e.target.value)}
                                         className="max-w-32"
                                  />
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{form.currency}</TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* ── DOCUMENTS ── */}
                  <TabsContent value="documents" className="space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground">
                      Cochez les documents applicables. Marquez s'ils sont obligatoires, uploadables, et ajoutez des notes.
                    </p>
                    {documentTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun type de document disponible.</p>
                    ) : (
                        <div className="space-y-2">
                          {documentTypes.map(doc => {
                            const current = form.requirements.find(r => r.documentTypeId === doc.id);
                            const checked = !!current;
                            return (
                                <div key={doc.id} className="rounded-lg border p-3 space-y-2 bg-card">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                          id={`req-${doc.id}`}
                                          checked={checked}
                                          onCheckedChange={() => toggleRequirement(doc.id)}
                                      />
                                      <Label htmlFor={`req-${doc.id}`} className="cursor-pointer font-medium">{doc.labelFr}</Label>
                                    </div>
                                    {checked && current?.isRequired && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                                  </div>
                                  {checked && current && (
                                      <div className="ps-6 space-y-2 pt-1 border-t">
                                        <div className="flex items-center gap-6 pt-2">
                                          <div className="flex items-center gap-2">
                                            <Switch checked={current.isRequired} onCheckedChange={v => updateRequirement(doc.id, { isRequired: v })} />
                                            <span className="text-xs">Obligatoire</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Switch checked={current.allowsUpload} onCheckedChange={v => updateRequirement(doc.id, { allowsUpload: v })} />
                                            <span className="text-xs">Upload autorisé</span>
                                          </div>
                                        </div>
                                        <Input placeholder="Notes FR" value={current.notesFr} onChange={e => updateRequirement(doc.id, { notesFr: e.target.value })} className="h-8 text-xs" />
                                        <Input placeholder="Notes EN" value={current.notesEn} onChange={e => updateRequirement(doc.id, { notesEn: e.target.value })} className="h-8 text-xs" />
                                        <Input placeholder="Notes AR" value={current.notesAr} onChange={e => updateRequirement(doc.id, { notesAr: e.target.value })} className="h-8 text-xs" dir="rtl" />
                                      </div>
                                  )}
                                </div>
                            );
                          })}
                        </div>
                    )}
                  </TabsContent>

                  {/* ── CONDITIONS ── */}
                  <TabsContent value="conditions" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Durée de séjour (jours)</Label>
                        <Input type="number" min={1} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
                      </div>
                      <div>
                        <Label>Délai de traitement (jours)</Label>
                        <Input type="number" min={1} value={form.processingDelay} onChange={e => setForm(f => ({ ...f, processingDelay: +e.target.value }))} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      D'autres conditions (validité, restrictions de nationalité…) seront ajoutées dans une prochaine itération.
                    </p>
                  </TabsContent>
                </Tabs>

                <Button className="w-full mt-6" onClick={handleSave} disabled={loading}>
                  {editId ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead>Type de visa</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visaTypes.map(vt => (
                      <TableRow key={vt.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/w40/${vt.country?.code.toLowerCase()}.png`} alt="" className="w-6 h-4 rounded object-cover" />
                            {vt.country?.nameFr.toLowerCase()}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{vt.nameFr}</TableCell>
                        <TableCell>{vt.country?.code.toUpperCase()}</TableCell>
                        <TableCell>{Number(vt.price).toLocaleString()} {vt.currency}</TableCell>
                        <TableCell>{vt.duration}j</TableCell>
                        <TableCell>
                          <span className={`inline-block w-2 h-2 rounded-full ${vt.isActive ? 'bg-green-500' : 'bg-destructive'}`} />
                        </TableCell>
                        <TableCell className="text-end space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(vt)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vt.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                  ))}
                  {visaTypes.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun type de visa</TableCell>
                      </TableRow>
                  )}
                  {loading && visaTypes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chargement…</TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </>
  );
};

export default VisaTypesAdmin;