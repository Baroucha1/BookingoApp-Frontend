import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BookingDetailContent from './BookingDetailContent';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pnr: string;
  refId: string;
  onChanged?: () => void;
}

export default function BookingDetailDrawer({ open, onOpenChange, pnr, refId, onChanged }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-white border-slate-200">
        <SheetHeader>
          <SheetTitle className="text-[#0B0F2E]">Détails de la réservation</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {open && pnr && refId && (
              <BookingDetailContent pnr={pnr} refId={refId} onClose={() => onOpenChange(false)} onChanged={onChanged} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
