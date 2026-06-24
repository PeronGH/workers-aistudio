import { lazy, Suspense } from "react";
import { Toasty } from "@cloudflare/kumo/components/toast";
import { Chat } from "./Chat";
import { useView } from "./hooks/useView";
import { toastManager } from "./utils/toast";
import type { SidebarMode } from "./components/Sidebar";

const ImageStudio = lazy(() =>
  import("./ImageStudio").then((m) => ({ default: m.ImageStudio }))
);

const Playground = lazy(() =>
  import("./Playground").then((m) => ({ default: m.Playground }))
);

export default function App() {
  const [view, navigate] = useView();

  const handleSelectMode = (mode: SidebarMode) => {
    if (mode === "images") navigate({ kind: "images" });
    else if (mode === "playground") navigate({ kind: "playground" });
    else navigate({ kind: "chat", uuid: null });
  };

  return (
    <Toasty toastManager={toastManager}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-dvh text-kumo-inactive">
            Loading...
          </div>
        }
      >
        {view.kind === "images" ? (
          <ImageStudio onSelectMode={handleSelectMode} />
        ) : view.kind === "playground" ? (
          <Playground onSelectMode={handleSelectMode} />
        ) : (
          <Chat
            activeUuid={view.uuid}
            onNavigate={(uuid) => navigate({ kind: "chat", uuid })}
            onSelectMode={handleSelectMode}
          />
        )}
      </Suspense>
    </Toasty>
  );
}
