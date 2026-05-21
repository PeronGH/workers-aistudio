import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — silent */
        }
      }}
      aria-label="Copy message"
      className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-kumo-subtle hover:text-kumo-default opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {copied ? (
        <>
          <CheckIcon size={12} /> Copied
        </>
      ) : (
        <>
          <CopyIcon size={12} /> Copy
        </>
      )}
    </button>
  );
}
