import { useCallback, useState } from "react";
import { useChat } from "./hooks/useChat";
import { useRunSettings } from "./hooks/useRunSettings";
import { useAttachments } from "./hooks/useAttachments";
import { uploadImage } from "./utils/attachments";
import { Header } from "./components/Header";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { SettingsPanel } from "./components/SettingsPanel";

export function Chat() {
  const [input, setInput] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const { messages, send, stop, clear, isStreaming, error } = useChat();
  const { settings, update, reset } = useRunSettings();
  const att = useAttachments();

  const submit = useCallback(async () => {
    const text = input.trim();
    if ((!text && att.attachments.length === 0) || isStreaming) return;

    const images = await Promise.all(
      att.attachments.map(async (a) => ({
        url: await uploadImage(a.file),
        mediaType: a.mediaType
      }))
    );

    setInput("");
    att.clear();
    await send({ text, images, settings });
  }, [input, att, isStreaming, send, settings]);

  return (
    <div
      className="flex flex-col h-screen bg-kumo-elevated"
      onDragOver={att.onDragOver}
      onDragLeave={att.onDragLeave}
      onDrop={att.onDrop}
    >
      <Header
        isStreaming={isStreaming}
        showDebug={showDebug}
        onToggleDebug={setShowDebug}
        onClear={clear}
      />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            showDebug={showDebug}
            isDragging={att.isDragging}
          />
          {error && (
            <div className="max-w-4xl mx-auto w-full px-5 pb-2 text-xs text-kumo-danger">
              {error}
            </div>
          )}
          <div className="border-t border-kumo-line bg-kumo-base">
            <Composer
              input={input}
              onInputChange={setInput}
              attachments={att.attachments}
              onAddFiles={att.add}
              onRemoveAttachment={att.remove}
              onPaste={att.onPaste}
              onSubmit={submit}
              onStop={stop}
              isStreaming={isStreaming}
            />
          </div>
        </div>
        <SettingsPanel settings={settings} onUpdate={update} onReset={reset} />
      </div>
    </div>
  );
}
