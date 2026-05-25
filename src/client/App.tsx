import { Suspense } from "react";
import { Toasty } from "@cloudflare/kumo/components/toast";
import { Chat } from "./Chat";
import { toastManager } from "./utils/toast";

export default function App() {
  return (
    <Toasty toastManager={toastManager}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-kumo-inactive">
            Loading...
          </div>
        }
      >
        <Chat />
      </Suspense>
    </Toasty>
  );
}
