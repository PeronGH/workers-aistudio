import { useState } from "react";

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
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Edit message"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-2xl rounded-br-md border border-kumo-line bg-kumo-base text-kumo-default focus:outline-none focus:ring-1 focus:ring-kumo-accent resize-y"
        />
        <div className="flex justify-end gap-2 mt-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-xs rounded-md border border-kumo-line text-kumo-default hover:bg-kumo-control"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(draft.trim())}
            className="px-2.5 py-1 text-xs rounded-md bg-kumo-contrast text-kumo-inverse hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
