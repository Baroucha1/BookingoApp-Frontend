import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function CancelConfirmDialog({ open, onOpenChange, onConfirm, loading }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Frais d'annulation applicables</AlertDialogTitle>
          <AlertDialogDescription>
            Des frais peuvent s'appliquer selon les conditions tarifaires. Consultez l'onglet "Conditions" avant de confirmer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Retour</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? '...' : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
