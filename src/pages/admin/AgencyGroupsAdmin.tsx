import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Users, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedAgencyGroups, seedAgencies, type AgencyGroupMock } from '@/lib/mockAdminData';

const empty = { name: '', description: '', agencies: [] as string[] };

const AgencyGroupsAdmin = () => {
  const [groups, setGroups] = useState<AgencyGroupMock[]>(seedAgencyGroups);
  const agencies = seedAgencies;
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const { toast } = useToast();

  const reset = () => { setForm(empty); setEditId(null); };

  const save = () => {
    if (!form.name.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    if (editId) {
      setGroups(p => p.map(g => g.id === editId ? { ...g, ...form } : g));
      toast({ title: 'Groupe mis à jour' });
    } else {
      setGroups(p => [...p, { id: `grp-${crypto.randomUUID()}`, ...form }]);
      toast({ title: 'Groupe créé' });
    }
    setOpen(false); reset();
  };

  const edit = (g: AgencyGroupMock) => {
    setForm({ name: g.name, description: g.description ?? '', agencies: g.agencies });
    setEditId(g.id);
    setOpen(true);
  };

  const del = (id: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    setGroups(p => p.filter(g => g.id !== id));
  };

  const toggleAgency = (id: string) => {
    setForm(f => ({ ...f, agencies: f.agencies.includes(id) ? f.agencies.filter(a => a !== id) : [...f.agencies, id] }));
  };

  const agencyName = (id: string) => agencies.find(a => a.id === id)?.companyName ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Groupes d'agences</h1>
          <p className="text-sm text-muted-foreground mt-1">Tarifs préférentiels par groupe</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 me-2" /> Nouveau groupe</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Nouveau'} groupe</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Premium" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div>
                <Label>Agences ({form.agencies.length})</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y mt-1">
                  {agencies.map(a => (
                    <label key={a.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm">
                      <Checkbox checked={form.agencies.includes(a.id)} onCheckedChange={() => toggleAgency(a.id)} />
                      <span className="flex-1">{a.companyName}</span>
                      {a.isVerified && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-[10px]">Vérifiée</Badge>}
                    </label>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={save}>{editId ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => (
          <Card key={g.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{g.name}</h3>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => edit(g)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(g.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              {g.description && <p className="text-xs text-muted-foreground mb-3">{g.description}</p>}
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5" /> {g.agencies.length} agence(s)</div>
              <div className="flex flex-wrap gap-1">
                {g.agencies.length === 0 && <span className="text-xs text-muted-foreground italic">Aucune agence</span>}
                {g.agencies.map(id => <Badge key={id} variant="secondary" className="text-xs">{agencyName(id)}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgencyGroupsAdmin;
