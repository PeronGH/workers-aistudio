import { useState } from "react";
import { Button } from "@cloudflare/kumo";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="xs"
      icon={copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
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
      className="text-kumo-subtle opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
