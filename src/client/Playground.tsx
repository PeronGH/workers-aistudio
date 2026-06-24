import { useCallback, useRef, useState } from "react";
import { Button, InputArea, Text } from "@cloudflare/kumo";
import {
  CursorTextIcon,
  ListIcon,
  PlayIcon,
  SlidersIcon,
  StopIcon,
  TerminalWindowIcon
} from "@phosphor-icons/react";
import { useCompletion } from "./hooks/useCompletion";
import { useRunSettings } from "./hooks/useRunSettings";
import { usePlaygroundStore } from "./hooks/usePlaygroundStore";
import { Sidebar, type SidebarMode } from "./components/Sidebar";
import { SidebarList } from "./components/SidebarList";
import { SettingsPanel } from "./components/SettingsPanel";
import { toastSuccess } from "./utils/toast";

interface PlaygroundProps {
  onSelectMode: (mode: SidebarMode) => void;
}

export function Playground({ onSelectMode }: PlaygroundProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    settings,
    update: updateSettings,
    reset: resetSettings
  } = useRunSettings();
  const { text, setText, generate, stop, isStreaming } = useCompletion();
  const {
    index: storeIndex,
    create: storeCreate,
    load: storeLoad,
    del: storeDel
  } = usePlaygroundStore();

  const handleGenerate = useCallback(
    (atCursor: boolean) => {
      const pos = atCursor
        ? (textareaRef.current?.selectionStart ?? null)
        : null;
      void generate(text, pos, settings).then((insertPos) => {
        if (insertPos !== undefined && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = insertPos;
          textareaRef.current.selectionEnd = insertPos;
        }
      });
    },
    [text, settings, generate]
  );

  const handleSave = useCallback(() => {
    if (!text) return;
    void storeCreate(text).then(() => toastSuccess("Saved."));
  }, [text, storeCreate]);

  const handleNew = useCallback(() => {
    setText("");
    setDrawerOpen(false);
  }, [setText]);

  const handleSelect = useCallback(
    (id: string) => {
      setText(storeLoad(id));
      setDrawerOpen(false);
    },
    [storeLoad, setText]
  );

  const handleDelete = useCallback(
    (id: string) => {
      storeDel(id);
    },
    [storeDel]
  );

  return (
    <div className="flex h-dvh bg-kumo-elevated">
      <Sidebar
        mode="playground"
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onSelectMode={onSelectMode}
      >
        <SidebarList
          entries={storeIndex}
          activeId={null}
          icon={TerminalWindowIcon}
          emptyLabel="No saved prompts."
          newLabel="New prompt"
          onNew={handleNew}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </Sidebar>
      <div className="flex flex-col flex-1 min-w-0">
        <header className="px-5 py-4 bg-kumo-base border-b border-kumo-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                shape="square"
                aria-label="Open sidebar"
                icon={<ListIcon size={16} />}
                onClick={() => setDrawerOpen(true)}
                className="md:hidden"
              />
              <h1 className="text-lg font-semibold text-kumo-default">
                Raw Mode
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Text size="xs" variant="secondary">
                {text.length} chars
              </Text>
              <Button
                variant="ghost"
                shape="square"
                aria-label="Open settings"
                icon={<SlidersIcon size={16} />}
                onClick={() => setSettingsOpen(true)}
                className="md:hidden"
              />
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 p-4">
            <InputArea
              ref={textareaRef}
              value={text}
              onValueChange={setText}
              placeholder="Type your prompt here..."
              disabled={isStreaming}
              className="w-full h-full font-mono resize-none bg-kumo-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (!isStreaming) handleGenerate(e.shiftKey);
                }
              }}
            />
          </div>
          <div className="border-t border-kumo-line bg-kumo-base px-4 py-3">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              {isStreaming ? (
                <Button
                  variant="secondary"
                  icon={<StopIcon size={16} />}
                  onClick={stop}
                >
                  Stop
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    icon={<CursorTextIcon size={16} />}
                    onClick={() => handleGenerate(true)}
                    disabled={!text}
                  >
                    Generate at cursor
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<PlayIcon size={16} />}
                    onClick={() => handleGenerate(false)}
                    disabled={!text}
                  >
                    Generate from end
                  </Button>
                </>
              )}
              <span className="ml-auto hidden sm:block">
                <Text size="xs" variant="secondary">
                  {isStreaming
                    ? "Generating..."
                    : "Ctrl+Enter: from end · Ctrl+Shift+Enter: at cursor"}
                </Text>
              </span>
            </div>
          </div>
        </div>
      </div>
      <SettingsPanel
        settings={settings}
        drawerOpen={settingsOpen}
        onCloseDrawer={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
        onReset={resetSettings}
        canSave={!!text}
        onSave={handleSave}
        showCompletionSettings
        onApplyTemplate={setText}
      />
    </div>
  );
}
