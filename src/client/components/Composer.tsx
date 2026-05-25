import { useRef } from "react";
import { Button, InputArea, Loader } from "@cloudflare/kumo";
import {
  MicrophoneIcon,
  PaperclipIcon,
  PaperPlaneRightIcon,
  StopIcon,
  XIcon
} from "@phosphor-icons/react";
import type { Attachment } from "../utils/attachments";
import { useVoiceInput } from "../hooks/useVoiceInput";

interface ComposerProps {
  input: string;
  onInputChange: (next: string) => void;
  attachments: Attachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  transcriptionLanguage: string | undefined;
}

export function Composer({
  input,
  onInputChange,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  onPaste,
  onSubmit,
  onStop,
  isStreaming,
  transcriptionLanguage
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef(input);
  inputRef.current = input;
  const voice = useVoiceInput({
    language: transcriptionLanguage,
    onTranscribed: (text) => {
      const current = inputRef.current;
      onInputChange(current ? `${current} ${text}` : text);
    }
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="max-w-4xl mx-auto px-5 py-4"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        aria-label="Attach images"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onAddFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {voice.error && (
        <div className="text-xs text-kumo-danger mb-2">{voice.error}</div>
      )}

      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group rounded-lg border border-kumo-line bg-kumo-control overflow-hidden"
            >
              <img
                src={att.preview}
                alt={att.file.name}
                className="h-16 w-16 object-cover"
              />
              <Button
                variant="secondary"
                shape="circle"
                size="xs"
                aria-label={`Remove ${att.file.name}`}
                icon={<XIcon size={10} />}
                onClick={() => onRemoveAttachment(att.id)}
                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 rounded-xl border border-kumo-line bg-kumo-base p-3 shadow-sm focus-within:ring-2 focus-within:ring-kumo-ring focus-within:border-transparent transition-shadow">
        <Button
          type="button"
          variant="ghost"
          shape="square"
          aria-label="Attach images"
          icon={<PaperclipIcon size={18} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          className="mb-0.5"
        />
        <Button
          type="button"
          variant={voice.isRecording ? "primary" : "ghost"}
          shape="square"
          aria-label={voice.isRecording ? "Stop recording" : "Record voice"}
          icon={
            voice.isTranscribing ? (
              <Loader size="sm" />
            ) : voice.isRecording ? (
              <StopIcon size={18} />
            ) : (
              <MicrophoneIcon size={18} />
            )
          }
          onClick={() => (voice.isRecording ? voice.stop() : voice.start())}
          disabled={voice.isTranscribing || (isStreaming && !voice.isRecording)}
          className="mb-0.5"
        />
        <InputArea
          ref={textareaRef}
          value={input}
          onValueChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          onPaste={onPaste}
          placeholder={
            attachments.length > 0
              ? "Add a message or send images..."
              : "Send a message..."
          }
          disabled={isStreaming}
          rows={1}
          className="flex-1 min-w-0 font-mono ring-0! focus:ring-0! shadow-none! bg-transparent! outline-none! resize-none max-h-40"
        />
        {isStreaming ? (
          <Button
            type="button"
            variant="secondary"
            shape="square"
            aria-label="Stop generation"
            icon={<StopIcon size={18} />}
            onClick={onStop}
            className="mb-0.5"
          />
        ) : (
          <Button
            type="submit"
            variant="primary"
            shape="square"
            aria-label="Send message"
            disabled={!input.trim() && attachments.length === 0}
            icon={<PaperPlaneRightIcon size={18} />}
            className="mb-0.5"
          />
        )}
      </div>
    </form>
  );
}
