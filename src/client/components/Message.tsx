import { useState } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import {
  BrainIcon,
  CaretDownIcon,
  CheckIcon,
  CopyIcon
} from "@phosphor-icons/react";
import type { UiMessage } from "../../shared/messages";

interface MessageProps {
  message: UiMessage;
  isLastAssistant: boolean;
  isStreaming: boolean;
  showDebug: boolean;
}

export function Message({
  message,
  isLastAssistant,
  isStreaming,
  showDebug
}: MessageProps) {
  return (
    <div className="group space-y-2">
      {showDebug && (
        <pre className="text-[11px] text-kumo-subtle bg-kumo-control rounded-lg p-3 overflow-auto max-h-64">
          {JSON.stringify(message, null, 2)}
        </pre>
      )}
      {message.role === "user" ? (
        <UserBubble message={message} />
      ) : (
        <AssistantBubble
          message={message}
          isAnimating={isLastAssistant && isStreaming}
        />
      )}
    </div>
  );
}

function UserBubble({
  message
}: {
  message: Extract<UiMessage, { role: "user" }>;
}) {
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
      {message.text && (
        <div className="flex justify-end">
          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-kumo-contrast text-kumo-inverse leading-relaxed whitespace-pre-wrap">
            {message.text}
          </div>
        </div>
      )}
      {message.text && (
        <div className="flex justify-end">
          <CopyButton text={message.text} />
        </div>
      )}
    </>
  );
}

function AssistantBubble({
  message,
  isAnimating
}: {
  message: Extract<UiMessage, { role: "assistant" }>;
  isAnimating: boolean;
}) {
  const reasoningDone = !isAnimating || !!message.content;
  return (
    <>
      {message.reasoning?.trim() && (
        <div className="flex justify-start">
          <details className="max-w-[85%] w-full" open={!reasoningDone}>
            <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm select-none">
              <BrainIcon size={14} className="text-purple-400" />
              <span className="font-medium text-kumo-default">Reasoning</span>
              {reasoningDone ? (
                <span className="text-xs text-kumo-success">Complete</span>
              ) : (
                <span className="text-xs text-kumo-brand">Thinking...</span>
              )}
              <CaretDownIcon size={14} className="ml-auto text-kumo-inactive" />
            </summary>
            <pre className="mt-2 px-3 py-2 rounded-lg bg-kumo-control text-xs text-kumo-default whitespace-pre-wrap overflow-auto max-h-64">
              {message.reasoning}
            </pre>
          </details>
        </div>
      )}
      {message.content && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-kumo-base text-kumo-default leading-relaxed">
            <Streamdown
              className="sd-theme rounded-2xl rounded-bl-md p-3"
              plugins={{ code }}
              controls={false}
              isAnimating={isAnimating}
            >
              {message.content}
            </Streamdown>
          </div>
        </div>
      )}
      {message.content && !isAnimating && (
        <div className="flex justify-start">
          <CopyButton text={message.content} />
        </div>
      )}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
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
