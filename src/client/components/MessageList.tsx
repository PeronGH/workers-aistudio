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
  onPickPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  "Explain how Mixture-of-Experts inference works.",
  "Draft a one-paragraph product announcement.",
  "Summarize the latest news on Cloudflare Workers.",
  "Write a short shell one-liner to find the 10 largest files in a directory."
];

export function MessageList({
  messages,
  isStreaming,
  showDebug,
  isDragging,
  onPickPrompt
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
            contents={
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="px-3 py-1.5 text-sm rounded-lg border border-kumo-line bg-kumo-base text-kumo-default hover:bg-kumo-control transition-colors"
                    onClick={() => onPickPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            }
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
