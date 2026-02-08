import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ViewPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promptContent: string;
}

export function ViewPromptDialog({ isOpen, onClose, promptContent }: ViewPromptDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prompt</DialogTitle>
          <DialogDescription>
            The prompt used to generate this game
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-muted rounded-md max-h-[60vh] overflow-y-auto">
          <p className="whitespace-pre-wrap text-sm">{promptContent}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
