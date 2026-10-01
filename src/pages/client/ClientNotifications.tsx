import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, FileText, CreditCard, Info, FileCheck } from 'lucide-react';
import { seedClientNotifications, type ClientNotificationMock } from '@/lib/mockAdminData';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const notificationTranslations: Record<string, { title: TranslationKey; message: TranslationKey }> = {
  'noti-1': { title: 'clientNotificationTitle1', message: 'clientNotificationMessage1' },
  'noti-2': { title: 'clientNotificationTitle2', message: 'clientNotificationMessage2' },
  'noti-3': { title: 'clientNotificationTitle3', message: 'clientNotificationMessage3' },
  'noti-4': { title: 'clientNotificationTitle4', message: 'clientNotificationMessage4' },
  'noti-5': { title: 'clientNotificationTitle5', message: 'clientNotificationMessage5' },
};

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
  const { t, language } = useLanguage();
  const [items, setItems] = useState<ClientNotificationMock[]>(seedClientNotifications);
  const unread = items.filter(i => !i.read).length;
  const dateLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{unread} {t(unread === 1 ? 'clientNotificationUnreadSingular' : 'clientNotificationUnreadPlural')}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => setItems(items.map(i => ({ ...i, read: true })))}>
            <CheckCheck className="w-4 h-4 mr-2" /> {t('clientNotificationsMarkAllRead')}
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
                    <h3 className={cn('font-medium text-sm', !n.read && 'font-semibold')}>{notificationTranslations[n.id] ? t(notificationTranslations[n.id].title) : n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notificationTranslations[n.id] ? t(notificationTranslations[n.id].message) : n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.date).toLocaleString(dateLocale)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto opacity-30" />
            <p className="mt-3">{t('clientNotificationsEmpty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotifications;
