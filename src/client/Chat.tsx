import { useCallback, useState } from "react";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import { useActiveUuid } from "./hooks/useActiveUuid";
import { useRunSettings } from "./hooks/useRunSettings";
import { useAttachments } from "./hooks/useAttachments";
import { uploadImage } from "./utils/attachments";
import { api } from "./utils/api";
import type { UiMessage } from "../shared/messages";
import { Header } from "./components/Header";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import { SharedFooter } from "./components/SharedFooter";

const TITLE_MAX = 40;

export function Chat() {
  const [input, setInput] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeUuid, navigate] = useActiveUuid();
  const conversations = useConversations();
  const {
    state,
    path,
    messages,
    send,
    retry,
    editUser,
    selectSibling,
    stop,
    claimLocal,
    isStreaming,
    isLoading,
    error
  } = useChat(activeUuid);
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

    let uuid = activeUuid;
    if (!uuid) {
      uuid = crypto.randomUUID();
      conversations.add(uuid, text.slice(0, TITLE_MAX));
      claimLocal(uuid);
      navigate(uuid);
    }

    setInput("");
    att.clear();
    const ok = await send({ uuid, text, images, settings });
    if (ok) conversations.touch(uuid);
  }, [
    input,
    att,
    isStreaming,
    send,
    settings,
    activeUuid,
    conversations,
    navigate,
    claimLocal
  ]);

  const isShared =
    activeUuid !== null &&
    !conversations.index.some((e) => e.uuid === activeUuid);

  const clone = useCallback(async () => {
    if (!isShared || messages.length === 0) return;
    const newUuid = crypto.randomUUID();
    conversations.add(newUuid, deriveTitle(messages));
    claimLocal(newUuid);
    await api.api.conversations[":uuid"].$put({
      param: { uuid: newUuid },
      json: { ...state, settings }
    });
    navigate(newUuid);
  }, [
    isShared,
    messages,
    state,
    conversations,
    claimLocal,
    settings,
    navigate
  ]);

  const handleDelete = useCallback(
    async (uuid: string) => {
      try {
        await api.api.conversations[":uuid"].$delete({ param: { uuid } });
      } catch {
        /* ignore */
      }
      conversations.remove(uuid);
      if (activeUuid === uuid) navigate(null);
    },
    [conversations, activeUuid, navigate]
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
        activeUuid={activeUuid}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onNewChat={() => navigate(null)}
        onSelect={(uuid) => navigate(uuid)}
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
              path={path}
              isStreaming={isStreaming}
              showDebug={showDebug}
              isDragging={att.isDragging}
              readOnly={isShared}
              onRetry={(id) => {
                if (activeUuid) void retry(activeUuid, id, settings);
              }}
              onEdit={(id, text) => {
                if (activeUuid)
                  void editUser({
                    uuid: activeUuid,
                    nodeId: id,
                    text,
                    settings
                  });
              }}
              onSelectSibling={(parentId, childId) => {
                if (activeUuid) selectSibling(activeUuid, parentId, childId);
              }}
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
              {isShared ? (
                <SharedFooter canClone={messages.length > 0} onClone={clone} />
              ) : (
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
              )}
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

function deriveTitle(messages: UiMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser && firstUser.role === "user") {
    return firstUser.text.trim().slice(0, TITLE_MAX);
  }
  return "";
}
