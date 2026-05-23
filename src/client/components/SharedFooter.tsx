import { Button } from "@cloudflare/kumo";
import { CopyIcon } from "@phosphor-icons/react";

interface SharedFooterProps {
  canClone: boolean;
  onClone: () => void;
}

export function SharedFooter({ canClone, onClone }: SharedFooterProps) {
  return (
    <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-center gap-3">
      <span className="text-sm text-kumo-subtle">
        Read-only shared conversation.
      </span>
      <Button
        variant="secondary"
        icon={<CopyIcon size={14} />}
        onClick={onClone}
        disabled={!canClone}
      >
        Clone to continue
      </Button>
    </div>
  );
}
