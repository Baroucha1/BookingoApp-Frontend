import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, FileText, CreditCard, Info, FileCheck } from 'lucide-react';
import { seedClientNotifications, type ClientNotificationMock } from '@/lib/mockAdminData';
import { cn } from '@/lib/utils';

const iconMap = {
  application: FileText,
  payment: CreditCard,
  document: FileCheck,
  info: Info,
};

const colorMap = {
  application: 'text-primary bg-primary/10',
  payment: 'text-accent bg-accent/10',
  document: 'text-secondary bg-secondary/10',
  info: 'text-muted-foreground bg-muted',
};

const ClientNotifications = () => {
  const [items, setItems] = useState<ClientNotificationMock[]>(seedClientNotifications);
  const unread = items.filter(i => !i.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{unread} notification{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => setItems(items.map(i => ({ ...i, read: true })))}>
            <CheckCheck className="w-4 h-4 mr-2" /> Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map(n => {
          const Icon = iconMap[n.type];
          return (
            <Card
              key={n.id}
              className={cn('card-hover cursor-pointer', !n.read && 'border-primary/40 bg-primary/5')}
              onClick={() => setItems(items.map(i => i.id === n.id ? { ...i, read: true } : i))}
            >
              <CardContent className="p-4 flex gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[n.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn('font-medium text-sm', !n.read && 'font-semibold')}>{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.date).toLocaleString('fr-FR', { hour12: false })}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto opacity-30" />
            <p className="mt-3">Aucune notification</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotifications;
