import { useEffect, useRef } from "react";
import { Empty, Text } from "@cloudflare/kumo";
import { ChatCircleDotsIcon, ImageIcon } from "@phosphor-icons/react";
import type { UiMessage } from "../../shared/messages";
import { Message } from "./Message";

interface MessageListProps {
  messages: UiMessage[];
  isStreaming: boolean;
  showDebug: boolean;
  isDragging: boolean;
}

export function MessageList({
  messages,
  isStreaming,
  showDebug,
  isDragging
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        {messages.length === 0 && (
          <Empty
            icon={<ChatCircleDotsIcon size={32} />}
            title="Start a conversation"
          />
        )}

        {messages.map((message, i) => (
          <Message
            key={message.id}
            message={message}
            isLastAssistant={
              message.role === "assistant" && i === messages.length - 1
            }
            isStreaming={isStreaming}
            showDebug={showDebug}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
