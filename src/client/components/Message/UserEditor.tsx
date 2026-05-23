import { useState } from "react";
import { Button, InputArea } from "@cloudflare/kumo";

interface UserEditorProps {
  initial: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function UserEditor({ initial, onSave, onCancel }: UserEditorProps) {
  const [draft, setDraft] = useState(initial);
  const canSave = draft.trim().length > 0 && draft !== initial;
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] w-full">
        <InputArea
          value={draft}
          onValueChange={setDraft}
          aria-label="Edit message"
          rows={3}
          className="w-full resize-y"
        />
        <div className="flex justify-end gap-2 mt-1.5">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSave}
            onClick={() => onSave(draft.trim())}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
