import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Building, User as UserIcon, UserCog, Mail, Phone, Calendar, FileText, Receipt } from 'lucide-react';
import {
  type AdminUserMock, type AgencyMock, type ClientMock, type UserRole,
  seedPayments, mockApplicationsLite, findGroup,
} from '@/lib/mockAdminData';

export type UserSubject =
  | { kind: 'admin'; user: AdminUserMock }
  | { kind: 'agency'; user: AgencyMock }
  | { kind: 'client'; user: ClientMock };

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subject: UserSubject | null;
}

const roleColor: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
  AGENCY: 'bg-blue-100 text-blue-800 border-blue-300',
  CLIENT: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const Row = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium break-words">{value}</div>
    </div>
  </div>
);

const UserDetailDialog = ({ open, onOpenChange, subject }: Props) => {
  const stats = useMemo(() => {
    if (!subject) return { applications: 0, payments: 0 };
    const id = subject.user.id;
    const payments = seedPayments.filter(p => p.clientId === id || p.agencyId === id);
    const appIds = new Set(payments.map(p => p.applicationId).filter(Boolean) as string[]);
    Object.values(mockApplicationsLite).forEach(() => {/* noop */});
    return { applications: appIds.size, payments: payments.length };
  }, [subject]);

  if (!subject) return null;
  const { kind, user } = subject;
  const role: UserRole = user.role;
  const displayName =
    kind === 'agency' ? user.companyName :
    kind === 'client' ? user.fullName :
    user.email;

  const Icon = kind === 'admin' ? UserCog : kind === 'agency' ? Building : UserIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" /> {displayName}
            <Badge variant="outline" className={roleColor[role]}>{role}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <Row icon={Mail} label="Email" value={user.email} />
              <Row icon={Phone} label="Téléphone" value={user.phone || '—'} />
              <Row icon={UserCog} label="Rôle" value={<Badge variant="outline" className={roleColor[role]}>{role}</Badge>} />
              <Row icon={Calendar} label="Créé le" value={new Date(user.createdAt).toLocaleDateString('fr-FR')} />
              <Row icon={ShieldCheck} label="Actif" value={user.isActive ? <Badge className="bg-green-600">Oui</Badge> : <Badge variant="destructive">Non</Badge>} />
            </CardContent>
          </Card>

          {kind === 'admin' && (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Compte administrateur — accès complet au backoffice.</CardContent></Card>
          )}

          {kind === 'client' && (
            <Card>
              <CardContent className="p-4 grid grid-cols-3 gap-3">
                <Row icon={ShieldCheck} label="Vérifié" value={user.isVerified ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Oui</Badge> : <Badge variant="outline">Non</Badge>} />
                <Row icon={FileText} label="Demandes" value={stats.applications} />
                <Row icon={Receipt} label="Paiements" value={stats.payments} />
              </CardContent>
            </Card>
          )}

          {kind === 'agency' && (
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                <Row icon={Building} label="Société" value={user.companyName} />
                <Row icon={FileText} label="Tax ID" value={user.taxId || '—'} />
                <Row icon={ShieldCheck} label="Vérifiée" value={user.isVerified ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Oui</Badge> : <Badge variant="outline">Non</Badge>} />
                <Row icon={UserCog} label="Groupe" value={findGroup(user.groupId)?.name ?? '—'} />
                <Row icon={FileText} label="Demandes" value={stats.applications} />
                <Row icon={Receipt} label="Paiements" value={stats.payments} />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailDialog;
