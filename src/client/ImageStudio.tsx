import { useCallback, useMemo, useState } from "react";
import { Button, Text } from "@cloudflare/kumo";
import {
  ImageSquareIcon,
  ListIcon,
  PencilSimpleLineIcon,
  SlidersIcon
} from "@phosphor-icons/react";
import { Sidebar } from "./components/Sidebar";
import { ImageSidebarList } from "./components/ImageStudio/ImageSidebarList";
import { ImageComposer } from "./components/ImageStudio/ImageComposer";
import { ImageDetail } from "./components/ImageStudio/ImageDetail";
import { ImageSettingsPanel } from "./components/ImageStudio/ImageSettingsPanel";
import { useAttachments } from "./hooks/useAttachments";
import { useImageGeneration } from "./hooks/useImageGeneration";
import { useImageHistory } from "./hooks/useImageHistory";
import { useImageSettings } from "./hooks/useImageSettings";
import { toastError, toastSuccess } from "./utils/toast";

interface ImageStudioProps {
  onLeaveImages: () => void;
}

export function ImageStudio({ onLeaveImages }: ImageStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const refs = useAttachments();
  const history = useImageHistory();
  const { settings, update, reset } = useImageSettings();
  const { generate, remove, isGenerating } = useImageGeneration();

  const activeEntry = useMemo(
    () => history.entries.find((e) => e.id === activeId) ?? null,
    [history.entries, activeId]
  );

  const submit = useCallback(async () => {
    const text = prompt.trim();
    if (!text || isGenerating) return;
    try {
      const entry = await generate({
        prompt: text,
        references: refs.attachments,
        settings
      });
      history.add(entry);
      setActiveId(entry.id);
      setPrompt("");
      refs.clear();
      toastSuccess("Image generated");
    } catch (err) {
      toastError("Generation failed", (err as Error).message);
    }
  }, [prompt, isGenerating, generate, refs, settings, history]);

  const handleDelete = useCallback(
    async (id: string) => {
      const entry = history.entries.find((e) => e.id === id);
      if (!entry) return;
      history.remove(id);
      if (activeId === id) setActiveId(null);
      try {
        await remove(entry);
      } catch (err) {
        toastError("Delete failed", (err as Error).message);
      }
    },
    [history, activeId, remove]
  );

  const startFresh = useCallback(() => {
    setActiveId(null);
    setPrompt("");
    refs.clear();
  }, [refs]);

  return (
    <div
      className="flex h-screen bg-kumo-elevated"
      onDragOver={refs.onDragOver}
      onDragLeave={refs.onDragLeave}
      onDrop={refs.onDrop}
    >
      <Sidebar
        mode="images"
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onSelectMode={(m) => {
          if (m === "chat") onLeaveImages();
        }}
      >
        <div className="px-3 py-2 border-b border-kumo-line">
          <Button
            variant="secondary"
            icon={<PencilSimpleLineIcon size={14} />}
            onClick={() => {
              startFresh();
              setDrawerOpen(false);
            }}
            className="w-full"
          >
            New image
          </Button>
        </div>
        <ImageSidebarList
          entries={history.entries}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setDrawerOpen(false);
          }}
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
                Image Studio
              </h1>
            </div>
            <Button
              variant="ghost"
              shape="square"
              aria-label="Open settings"
              icon={<SlidersIcon size={16} />}
              onClick={() => setSettingsOpen(true)}
              className="md:hidden"
            />
          </div>
        </header>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {activeEntry ? (
              <ImageDetail entry={activeEntry} />
            ) : (
              <EmptyGallery generating={isGenerating} />
            )}
          </div>
          <div className="border-t border-kumo-line bg-kumo-base">
            <ImageComposer
              prompt={prompt}
              onPromptChange={setPrompt}
              references={refs.attachments}
              onAddFiles={refs.add}
              onRemoveReference={refs.remove}
              onPaste={refs.onPaste}
              onSubmit={submit}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
      <ImageSettingsPanel
        settings={settings}
        drawerOpen={settingsOpen}
        onCloseDrawer={() => setSettingsOpen(false)}
        onUpdate={update}
        onReset={reset}
      />
    </div>
  );
}

function EmptyGallery({ generating }: { generating: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3 text-kumo-subtle">
      <ImageSquareIcon size={36} />
      <Text size="sm" variant="secondary">
        {generating
          ? "Generating your image…"
          : "Type a prompt below to create an image."}
      </Text>
    </div>
  );
}
