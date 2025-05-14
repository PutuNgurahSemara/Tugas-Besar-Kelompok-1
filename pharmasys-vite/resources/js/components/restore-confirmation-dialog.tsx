import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArchiveRestore } from 'lucide-react';

interface RestoreConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  processing?: boolean;
}

export function RestoreConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  processing = false,
}: RestoreConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <ArchiveRestore className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Batal
          </Button>
          <Button variant="default" onClick={onConfirm} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
            {processing ? 'Memproses...' : 'Restore'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
