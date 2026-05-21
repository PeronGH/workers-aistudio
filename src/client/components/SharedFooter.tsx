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
      <button
        type="button"
        onClick={onClone}
        disabled={!canClone}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-control transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CopyIcon size={14} />
        Clone to continue
      </button>
    </div>
  );
}
