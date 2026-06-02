import { useState } from "react";
import { Button } from "@cloudflare/kumo";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import type { UiUserMessage } from "../../../shared/messages";
import { CopyButton } from "./CopyButton";
import { UserEditor } from "./UserEditor";

interface UserBubbleProps {
  message: UiUserMessage;
  nodeId: string;
  readOnly: boolean;
  onEdit: (userNodeId: string, text: string) => void;
}

export function UserBubble({
  message,
  nodeId,
  readOnly,
  onEdit
}: UserBubbleProps) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      {message.images.map((img, i) => (
        <div key={i} className="flex justify-end">
          <img
            src={img.url}
            alt="Attachment"
            className="max-h-64 rounded-xl border border-kumo-line object-contain"
          />
        </div>
      ))}
      {editing ? (
        <UserEditor
          initial={message.text}
          onSave={(text) => {
            setEditing(false);
            onEdit(nodeId, text);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        message.text && (
          <div className="flex justify-end">
            <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-kumo-contrast text-kumo-inverse leading-relaxed whitespace-pre-wrap">
              {message.text}
            </div>
          </div>
        )
      )}
      {!editing && (
        <div className="flex justify-end gap-1">
          {message.text && <CopyButton text={message.text} />}
          {!readOnly && (
            <Button
              variant="ghost"
              size="xs"
              icon={<PencilSimpleIcon size={12} />}
              onClick={() => setEditing(true)}
              className="text-kumo-subtle reveal-on-hover"
            >
              Edit
            </Button>
          )}
        </div>
      )}
    </>
  );
}
