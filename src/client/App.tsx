import { Suspense } from "react";
import { Toasty } from "@cloudflare/kumo/components/toast";
import { Chat } from "./Chat";
import { ImageStudio } from "./ImageStudio";
import { useView } from "./hooks/useView";
import { toastManager } from "./utils/toast";

export default function App() {
  const [view, navigate] = useView();
  return (
    <Toasty toastManager={toastManager}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-kumo-inactive">
            Loading...
          </div>
        }
      >
        {view.kind === "images" ? (
          <ImageStudio
            onLeaveImages={() => navigate({ kind: "chat", uuid: null })}
          />
        ) : (
          <Chat
            activeUuid={view.uuid}
            onNavigate={(uuid) => navigate({ kind: "chat", uuid })}
            onOpenImageStudio={() => navigate({ kind: "images" })}
          />
        )}
      </Suspense>
    </Toasty>
  );
}
