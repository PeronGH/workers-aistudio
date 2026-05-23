import { useEffect, useRef } from "react";
import { Empty, Text } from "@cloudflare/kumo";
import { ChatCircleDotsIcon, ImageIcon } from "@phosphor-icons/react";
import type { PathEntry } from "../../shared/conversations";
import { Message } from "./Message";

interface MessageListProps {
  path: PathEntry[];
  isStreaming: boolean;
  showDebug: boolean;
  isDragging: boolean;
  readOnly?: boolean;
  onRetry: (assistantNodeId: string) => void;
  onEdit: (userNodeId: string, text: string) => void;
  onSelectSibling: (parentId: string | null, childId: string) => void;
}

export function MessageList({
  path,
  isStreaming,
  showDebug,
  isDragging,
  readOnly = false,
  onRetry,
  onEdit,
  onSelectSibling
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = path[path.length - 1]?.node.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [path.length, lastId]);

  return (
    <div className="flex-1 overflow-y-auto relative">
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-kumo-elevated/80 backdrop-blur-sm border-2 border-dashed border-kumo-brand rounded-xl m-2 pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-kumo-brand">
            <ImageIcon size={40} />
            <Text variant="heading3" as="span">
              Drop images here
            </Text>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-5">
        {path.length === 0 && (
          <Empty
            icon={<ChatCircleDotsIcon size={32} />}
            title="Start a conversation"
          />
        )}

        {path.map((entry, i) => (
          <Message
            key={entry.node.id}
            entry={entry}
            isLastAssistant={
              entry.node.message.role === "assistant" && i === path.length - 1
            }
            isStreaming={isStreaming}
            showDebug={showDebug}
            readOnly={readOnly}
            onRetry={onRetry}
            onEdit={onEdit}
            onSelectSibling={onSelectSibling}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
