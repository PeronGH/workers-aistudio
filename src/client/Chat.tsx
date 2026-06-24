import { useCallback, useState } from "react";
import { useChat } from "./hooks/useChat";
import { useLocalIndex } from "./hooks/useLocalIndex";
import { useRunSettings } from "./hooks/useRunSettings";
import { useLocalSettings } from "./hooks/useLocalSettings";
import { useAttachments } from "./hooks/useAttachments";
import {
  imageToDataUrl,
  uploadImage,
  type AttachmentUpload
} from "./utils/attachments";
import { api } from "./utils/api";
import type { UiMessage } from "../shared/messages";
import type { RunSettings } from "../shared/settings";
import { Header } from "./components/Header";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { SettingsPanel } from "./components/SettingsPanel";
import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { Sidebar, type SidebarMode } from "./components/Sidebar";
import { SidebarList } from "./components/SidebarList";
import { SharedFooter } from "./components/SharedFooter";
import { withToast } from "./utils/toast";

const TITLE_MAX = 40;

interface ChatProps {
  activeUuid: string | null;
  onNavigate: (uuid: string | null) => void;
  onSelectMode: (mode: SidebarMode) => void;
}

export function Chat({
  activeUuid,
  onNavigate: navigate,
  onSelectMode
}: ChatProps) {
  const [input, setInput] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [anonymousSettings, setAnonymousSettings] = useState<RunSettings>({});
  const effectiveActiveUuid = anonymousMode ? null : activeUuid;
  const conversations = useLocalIndex("wai-studio:conversations");
  const {
    settings: savedSettings,
    update: updateSavedSettings,
    reset: resetSavedSettings,
    replace
  } = useRunSettings();
  const settings = anonymousMode ? anonymousSettings : savedSettings;
  const { settings: localSettings, update: updateLocal } = useLocalSettings();
  const {
    state,
    path,
    messages,
    send,
    retry,
    editUser,
    selectSibling,
    stop,
    resetChat,
    replaceChat,
    claimLocal,
    isStreaming,
    isLoading
  } = useChat(
    effectiveActiveUuid,
    (loaded) => replace(loaded.settings),
    !anonymousMode
  );
  const uploadAttachment = useCallback(
    async (file: File): Promise<AttachmentUpload> => ({
      // Anonymous chats never touch the server: encode inline instead.
      url: anonymousMode
        ? await imageToDataUrl(file)
        : (await uploadImage(file)).url,
      mediaType: file.type || "application/octet-stream"
    }),
    [anonymousMode]
  );
  const att = useAttachments(uploadAttachment);

  const updateSettings = useCallback(
    (patch: Partial<RunSettings>) => {
      if (!anonymousMode) {
        updateSavedSettings(patch);
        return;
      }
      setAnonymousSettings((prev) => cleanSettings({ ...prev, ...patch }));
    },
    [anonymousMode, updateSavedSettings]
  );

  const resetSettings = useCallback(() => {
    if (!anonymousMode) {
      resetSavedSettings();
      return;
    }
    setAnonymousSettings({});
  }, [anonymousMode, resetSavedSettings]);

  const enterAnonymousMode = useCallback(() => {
    if (isStreaming) return;
    setAnonymousSettings({ ...savedSettings });
    setAnonymousMode(true);
    setInput("");
    att.clear();
    replaceChat({ ...state, settings: savedSettings });
    navigate(null);
  }, [att, isStreaming, navigate, replaceChat, savedSettings, state]);

  const leaveAnonymousMode = useCallback(() => {
    if (!anonymousMode) return true;
    if (isStreaming) return false;
    if (messages.length > 0 && !confirm("Discard anonymous conversation?")) {
      return false;
    }
    setAnonymousMode(false);
    setAnonymousSettings({});
    setInput("");
    att.clear();
    resetChat();
    navigate(null);
    return true;
  }, [anonymousMode, att, isStreaming, messages.length, navigate, resetChat]);

  const toggleAnonymousMode = useCallback(() => {
    if (anonymousMode) {
      leaveAnonymousMode();
      return;
    }
    enterAnonymousMode();
  }, [anonymousMode, enterAnonymousMode, leaveAnonymousMode]);

  const handleNewChat = useCallback(() => {
    if (!anonymousMode) {
      navigate(null);
      return;
    }
    if (isStreaming) return;
    setInput("");
    att.clear();
    resetChat(settings);
  }, [anonymousMode, att, isStreaming, navigate, resetChat, settings]);

  const handleSelectConversation = useCallback(
    (uuid: string) => {
      if (!leaveAnonymousMode()) return;
      navigate(uuid);
    },
    [leaveAnonymousMode, navigate]
  );

  const submit = useCallback(async () => {
    const text = input.trim();
    // `att.ready` also blocks the Enter key, which bypasses the button's
    // disabled state, until every attachment has finished uploading.
    if ((!text && att.attachments.length === 0) || isStreaming || !att.ready) {
      return;
    }

    const images = att.materialize();

    let uuid = effectiveActiveUuid;
    if (!anonymousMode && !uuid) {
      uuid = crypto.randomUUID();
      conversations.add(uuid, text.slice(0, TITLE_MAX));
      claimLocal(uuid);
      navigate(uuid);
    }

    setInput("");
    att.clear();
    const ok = await send({ uuid, text, images, settings });
    if (ok && uuid) conversations.touch(uuid);
  }, [
    input,
    att,
    isStreaming,
    send,
    settings,
    effectiveActiveUuid,
    anonymousMode,
    conversations,
    navigate,
    claimLocal
  ]);

  const isShared =
    effectiveActiveUuid !== null &&
    !conversations.index.some((e) => e.uuid === effectiveActiveUuid);

  const clone = useCallback(async () => {
    if (!isShared || messages.length === 0) return;
    const newUuid = crypto.randomUUID();
    conversations.add(newUuid, deriveTitle(messages));
    claimLocal(newUuid);
    await withToast(
      api.api.conversations[":uuid"].$put({
        param: { uuid: newUuid },
        json: { ...state, settings }
      }),
      {
        loading: "Cloning conversation…",
        success: "Cloned.",
        errorTitle: "Clone failed"
      }
    );
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

  const handleRetry = useCallback(
    (id: string) => {
      if (anonymousMode || effectiveActiveUuid) {
        void retry(effectiveActiveUuid, id, settings);
      }
    },
    [anonymousMode, effectiveActiveUuid, retry, settings]
  );

  const handleEdit = useCallback(
    (id: string, text: string) => {
      if (anonymousMode || effectiveActiveUuid) {
        void editUser({
          uuid: effectiveActiveUuid,
          nodeId: id,
          text,
          settings
        });
      }
    },
    [anonymousMode, effectiveActiveUuid, editUser, settings]
  );

  const handleSelectSibling = useCallback(
    (parentId: string | null, childId: string) => {
      if (anonymousMode || effectiveActiveUuid) {
        selectSibling(effectiveActiveUuid, parentId, childId);
      }
    },
    [anonymousMode, effectiveActiveUuid, selectSibling]
  );

  const handleSave = useCallback(() => {
    if (!effectiveActiveUuid || isShared) return;
    void withToast(
      api.api.conversations[":uuid"].$put({
        param: { uuid: effectiveActiveUuid },
        json: { ...state, settings }
      }),
      {
        loading: "Saving…",
        success: "Saved.",
        errorTitle: "Save failed"
      }
    );
  }, [effectiveActiveUuid, isShared, state, settings]);

  const handleDelete = useCallback(
    async (uuid: string) => {
      conversations.remove(uuid);
      if (effectiveActiveUuid === uuid) navigate(null);
      await withToast(
        api.api.conversations[":uuid"].$delete({ param: { uuid } }),
        {
          loading: "Deleting…",
          success: "Deleted.",
          errorTitle: "Delete failed"
        }
      );
    },
    [conversations, effectiveActiveUuid, navigate]
  );

  return (
    <div
      className="flex h-dvh bg-kumo-elevated"
      onDragOver={att.onDragOver}
      onDragLeave={att.onDragLeave}
      onDrop={att.onDrop}
    >
      <Sidebar
        mode="chat"
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onSelectMode={(m) => {
          if (m !== "chat" && leaveAnonymousMode()) {
            onSelectMode(m);
          }
        }}
      >
        <SidebarList
          entries={conversations.index}
          activeId={effectiveActiveUuid}
          icon={ChatCircleDotsIcon}
          emptyLabel="No conversations yet."
          newLabel="New chat"
          onNew={() => {
            handleNewChat();
            setDrawerOpen(false);
          }}
          onSelect={(uuid) => {
            handleSelectConversation(uuid);
            setDrawerOpen(false);
          }}
          onDelete={handleDelete}
        />
      </Sidebar>
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          isStreaming={isStreaming}
          anonymousMode={anonymousMode}
          anonymousDisabled={isStreaming || isLoading}
          onToggleAnonymous={toggleAnonymousMode}
          onOpenSidebar={() => setDrawerOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <MessageList
            path={path}
            isStreaming={isStreaming}
            showDebug={showDebug}
            isDragging={att.isDragging}
            readOnly={isShared}
            onRetry={handleRetry}
            onEdit={handleEdit}
            onSelectSibling={handleSelectSibling}
          />
          {isLoading && (
            <div className="max-w-4xl mx-auto w-full px-5 pb-2 text-xs text-kumo-subtle">
              Loading conversation…
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
                attachmentsReady={att.ready}
                transcriptionLanguage={localSettings.transcriptionLanguage}
              />
            )}
          </div>
        </div>
      </div>
      <SettingsPanel
        settings={settings}
        localSettings={localSettings}
        drawerOpen={settingsOpen}
        onCloseDrawer={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
        onUpdateLocal={updateLocal}
        onReset={resetSettings}
        showDebug={showDebug}
        onToggleDebug={setShowDebug}
        canSave={effectiveActiveUuid !== null && !isShared}
        onSave={handleSave}
        showSystemPrompt
        showThinking
      />
    </div>
  );
}

function cleanSettings(settings: RunSettings): RunSettings {
  const cleaned: RunSettings = {};
  for (const [k, v] of Object.entries(settings)) {
    if (v !== undefined) (cleaned as Record<string, unknown>)[k] = v;
  }
  return cleaned;
}

function deriveTitle(messages: UiMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser && firstUser.role === "user") {
    return firstUser.text.trim().slice(0, TITLE_MAX);
  }
  return "";
}
