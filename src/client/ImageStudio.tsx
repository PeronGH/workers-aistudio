import { useCallback, useMemo, useState } from "react";
import { Button } from "@cloudflare/kumo";
import { Empty } from "@cloudflare/kumo/components/empty";
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
import { useImageDraft } from "./hooks/useImageDraft";
import { useImageGeneration } from "./hooks/useImageGeneration";
import { useImageHistory } from "./hooks/useImageHistory";
import { MAX_REFERENCES } from "../shared/images";
import { toastError, toastSuccess } from "./utils/toast";

interface ImageStudioProps {
  onLeaveImages: () => void;
}

export function ImageStudio({ onLeaveImages }: ImageStudioProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const {
    draft,
    setPrompt,
    setModel,
    setWidth,
    setHeight,
    setSteps,
    addLocalFiles,
    addRemoteReference,
    removeReference,
    loadFromEntry,
    clearComposer,
    resetSettings,
    onPaste,
    onDragOver,
    onDrop
  } = useImageDraft();
  const history = useImageHistory();
  const { generate, remove, isGenerating } = useImageGeneration();

  const activeEntry = useMemo(
    () => history.entries.find((e) => e.id === activeId) ?? null,
    [history.entries, activeId]
  );

  const submit = useCallback(async () => {
    const text = draft.prompt.trim();
    if (!text || isGenerating) return;
    try {
      const entry = await generate({ ...draft, prompt: text });
      history.add(entry);
      setActiveId(entry.id);
      clearComposer();
      toastSuccess("Image generated");
    } catch (err) {
      toastError("Generation failed", (err as Error).message);
    }
  }, [draft, isGenerating, generate, history, clearComposer]);

  const handleDelete = useCallback(
    async (id: string) => {
      history.remove(id);
      if (activeId === id) setActiveId(null);
      try {
        await remove(id);
      } catch (err) {
        toastError("Delete failed", (err as Error).message);
      }
    },
    [history, activeId, remove]
  );

  const selectEntry = useCallback(
    (id: string) => {
      const entry = history.entries.find((e) => e.id === id);
      if (!entry) return;
      setActiveId(id);
      setDrawerOpen(false);
      loadFromEntry(entry);
    },
    [history.entries, loadFromEntry]
  );

  const startFresh = useCallback(() => {
    setActiveId(null);
    clearComposer();
  }, [clearComposer]);

  const useAsReference = useCallback(
    (id: string) => {
      if (!addRemoteReference(id)) {
        toastError(
          "Reference limit reached",
          `Up to ${MAX_REFERENCES} reference images.`
        );
      }
    },
    [addRemoteReference]
  );

  return (
    <div
      className="flex h-dvh bg-kumo-elevated"
      onDragOver={onDragOver}
      onDrop={onDrop}
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
          onSelect={selectEntry}
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
              <ImageDetail
                entry={activeEntry}
                onUseAsReference={useAsReference}
              />
            ) : (
              <EmptyGallery generating={isGenerating} />
            )}
          </div>
          <div className="border-t border-kumo-line bg-kumo-base">
            <ImageComposer
              prompt={draft.prompt}
              onPromptChange={setPrompt}
              references={draft.references}
              onAddFiles={addLocalFiles}
              onRemoveReference={removeReference}
              onPaste={onPaste}
              onSubmit={submit}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
      <ImageSettingsPanel
        model={draft.model}
        width={draft.width}
        height={draft.height}
        steps={draft.steps}
        drawerOpen={settingsOpen}
        onCloseDrawer={() => setSettingsOpen(false)}
        onModelChange={setModel}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onStepsChange={setSteps}
        onReset={resetSettings}
      />
    </div>
  );
}

function EmptyGallery({ generating }: { generating: boolean }) {
  return (
    <div className="h-full flex items-center justify-center">
      <Empty
        icon={<ImageSquareIcon size={36} />}
        title={generating ? "Generating your image…" : "Nothing here yet"}
        description={
          generating ? undefined : "Type a prompt below to create an image."
        }
      />
    </div>
  );
}
