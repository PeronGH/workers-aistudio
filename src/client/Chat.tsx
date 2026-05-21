import { useCallback, useState } from "react";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import { useRunSettings } from "./hooks/useRunSettings";
import { useAttachments } from "./hooks/useAttachments";
import { uploadImage } from "./utils/attachments";
import { Header } from "./components/Header";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";

const TITLE_MAX = 40;

export function Chat() {
  const [input, setInput] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const conversations = useConversations();
  const { messages, send, stop, isStreaming, isLoading, error } = useChat(
    conversations.activeUuid
  );
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

    const uuid = conversations.activeUuid
      ? conversations.activeUuid
      : conversations.startNew(text.slice(0, TITLE_MAX));

    setInput("");
    att.clear();
    const ok = await send({ uuid, text, images, settings });
    if (ok) conversations.touch(uuid);
  }, [input, att, isStreaming, send, settings, conversations]);

  const handleDelete = useCallback(
    async (uuid: string) => {
      try {
        await fetch(`/api/conversations/${uuid}`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
      conversations.remove(uuid);
    },
    [conversations]
  );

  return (
    <div
      className="flex h-screen bg-kumo-elevated"
      onDragOver={att.onDragOver}
      onDragLeave={att.onDragLeave}
      onDrop={att.onDrop}
    >
      <Sidebar
        entries={conversations.index}
        activeUuid={conversations.activeUuid}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onNewChat={() => conversations.select(null)}
        onSelect={(uuid) => conversations.select(uuid)}
        onDelete={handleDelete}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          isStreaming={isStreaming}
          showDebug={showDebug}
          onToggleDebug={setShowDebug}
          onOpenSidebar={() => setDrawerOpen(true)}
        />
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              showDebug={showDebug}
              isDragging={att.isDragging}
            />
            {isLoading && (
              <div className="max-w-4xl mx-auto w-full px-5 pb-2 text-xs text-kumo-subtle">
                Loading conversation…
              </div>
            )}
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
          <SettingsPanel
            settings={settings}
            onUpdate={update}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
