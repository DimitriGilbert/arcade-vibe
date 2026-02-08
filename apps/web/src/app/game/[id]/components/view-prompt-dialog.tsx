import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
} from "@/components/arcade";

interface ViewPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promptContent: string;
}

export function ViewPromptDialog({
  isOpen,
  onClose,
  promptContent,
}: ViewPromptDialogProps) {
  return (
    <ArcadeDialog open={isOpen} onOpenChange={onClose}>
      <ArcadeDialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <ArcadeDialogHeader>
          <ArcadeDialogTitle>Prompt</ArcadeDialogTitle>
          <ArcadeDialogDescription>
            The prompt used to generate this game
          </ArcadeDialogDescription>
        </ArcadeDialogHeader>
        <div className="p-4 bg-[var(--muted)] rounded-none max-h-[60vh] overflow-y-auto">
          <p className="whitespace-pre-wrap text-sm">{promptContent}</p>
        </div>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
