import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Phone, Hash, ShieldCheck, Lock, Save, Edit2 } from 'lucide-react';
import { currentAgency, findGroup } from '@/lib/mockAdminData';
import { toast } from 'sonner';

const AgencyProfile = () => {
  const group = findGroup(currentAgency.groupId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName: currentAgency.companyName,
    email: currentAgency.email,
    phone: currentAgency.phone,
    taxId: currentAgency.taxId,
  });
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' });

  const save = () => {
    setEditing(false);
    toast.success('Profil mis à jour (mock)');
  };

  const changePwd = () => {
    if (!pwd.current || !pwd.new || !pwd.confirm) return toast.error('Veuillez remplir tous les champs');
    if (pwd.new !== pwd.confirm) return toast.error('Les mots de passe ne correspondent pas');
    setPwd({ current: '', new: '', confirm: '' });
    toast.success('Mot de passe changé (mock)');
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header card */}
      <Card className="overflow-hidden animate-fade-in-up shadow-elegant">
        <div className="bg-gradient-hero h-24" />
        <CardContent className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-card shadow-elegant border-4 border-card flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold">{form.companyName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {group && <Badge className="bg-gradient-accent text-accent-foreground border-0">{group.name}</Badge>}
                {currentAgency.isVerified && (
                  <Badge variant="outline" className="border-accent text-accent gap-1"><ShieldCheck className="w-3 h-3" />Vérifiée</Badge>
                )}
                {currentAgency.isActive && <Badge variant="outline">Active</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card className="animate-fade-in-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Informations générales</CardTitle>
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit2 className="w-3 h-3 me-1" />Modifier</Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm({
                companyName: currentAgency.companyName, email: currentAgency.email,
                phone: currentAgency.phone, taxId: currentAgency.taxId,
              }); }}>Annuler</Button>
              <Button size="sm" onClick={save}><Save className="w-3 h-3 me-1" />Enregistrer</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField icon={Building2} label="Nom de l'entreprise" value={form.companyName} editing={editing} onChange={v => setForm({ ...form, companyName: v })} />
          <FormField icon={Hash} label="NIF / Tax ID" value={form.taxId} editing={editing} onChange={v => setForm({ ...form, taxId: v })} />
          <FormField icon={Mail} label="Email" value={form.email} editing={editing} onChange={v => setForm({ ...form, email: v })} type="email" />
          <FormField icon={Phone} label="Téléphone" value={form.phone} editing={editing} onChange={v => setForm({ ...form, phone: v })} />
        </CardContent>
      </Card>

      {/* Group info */}
      <Card className="animate-fade-in-up">
        <CardHeader><CardTitle className="text-base">Mon groupe</CardTitle></CardHeader>
        <CardContent>
          {group ? (
            <div className="p-4 rounded-lg bg-gradient-accent text-accent-foreground">
              <div className="text-xs uppercase tracking-wider opacity-80">Groupe assigné</div>
              <div className="text-xl font-bold mt-1">{group.name}</div>
              <div className="text-sm opacity-90 mt-1">{group.description}</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun groupe assigné — tarifs standards appliqués.</p>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="animate-fade-in-up">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" />Changer le mot de passe</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Mot de passe actuel</Label><Input type="password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nouveau mot de passe</Label><Input type="password" value={pwd.new} onChange={e => setPwd({ ...pwd, new: e.target.value })} /></div>
            <div><Label>Confirmer</Label><Input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></div>
          </div>
          <Button onClick={changePwd} className="bg-gradient-primary text-primary-foreground"><Lock className="w-4 h-4 me-1" />Mettre à jour</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const FormField = ({ icon: Icon, label, value, editing, onChange, type = 'text' }: any) => (
  <div>
    <Label className="flex items-center gap-1.5 mb-1"><Icon className="w-3 h-3" />{label}</Label>
    {editing
      ? <Input type={type} value={value} onChange={e => onChange(e.target.value)} />
      : <div className="p-2.5 rounded-md border bg-muted/30 text-sm font-medium">{value || '—'}</div>}
  </div>
);

export default AgencyProfile;
