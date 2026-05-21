import type { PathEntry } from "../../../shared/conversations";
import { UserBubble } from "./UserBubble";
import { AssistantBubble } from "./AssistantBubble";
import { SiblingNav } from "./SiblingNav";

interface MessageProps {
  entry: PathEntry;
  isLastAssistant: boolean;
  isStreaming: boolean;
  showDebug: boolean;
  readOnly?: boolean;
  onRetry: (assistantNodeId: string) => void;
  onEdit: (userNodeId: string, text: string) => void;
  onSelectSibling: (parentId: string | null, childId: string) => void;
}

export function Message({
  entry,
  isLastAssistant,
  isStreaming,
  showDebug,
  readOnly = false,
  onRetry,
  onEdit,
  onSelectSibling
}: MessageProps) {
  const { node, siblings, siblingIndex } = entry;
  const isUser = node.message.role === "user";
  const align = isUser ? "justify-end" : "justify-start";

  return (
    <div className="group space-y-2">
      {showDebug && (
        <pre className="text-[11px] text-kumo-subtle bg-kumo-control rounded-lg p-3 overflow-auto max-h-64">
          {JSON.stringify(node, null, 2)}
        </pre>
      )}
      {node.message.role === "user" ? (
        <UserBubble
          message={node.message}
          nodeId={node.id}
          readOnly={readOnly}
          onEdit={onEdit}
        />
      ) : (
        <AssistantBubble
          message={node.message}
          nodeId={node.id}
          readOnly={readOnly}
          isAnimating={isLastAssistant && isStreaming}
          onRetry={onRetry}
        />
      )}
      {siblings.length > 1 && (
        <SiblingNav
          align={align}
          index={siblingIndex}
          count={siblings.length}
          onPrev={() =>
            onSelectSibling(node.parentId, siblings[siblingIndex - 1])
          }
          onNext={() =>
            onSelectSibling(node.parentId, siblings[siblingIndex + 1])
          }
        />
      )}
    </div>
  );
}
