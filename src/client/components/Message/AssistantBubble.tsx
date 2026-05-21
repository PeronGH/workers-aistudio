import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import {
  ArrowClockwiseIcon,
  BrainIcon,
  CaretDownIcon
} from "@phosphor-icons/react";
import type { UiAssistantMessage } from "../../../shared/messages";
import { ActionChip } from "./ActionChip";
import { CopyButton } from "./CopyButton";

interface AssistantBubbleProps {
  message: UiAssistantMessage;
  nodeId: string;
  readOnly: boolean;
  isAnimating: boolean;
  onRetry: (assistantNodeId: string) => void;
}

export function AssistantBubble({
  message,
  nodeId,
  readOnly,
  isAnimating,
  onRetry
}: AssistantBubbleProps) {
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
        <div className="flex justify-start gap-1">
          <CopyButton text={message.content} />
          {!readOnly && (
            <ActionChip
              label="Retry"
              icon={<ArrowClockwiseIcon size={12} />}
              onClick={() => onRetry(nodeId)}
            />
          )}
        </div>
      )}
    </>
  );
}
