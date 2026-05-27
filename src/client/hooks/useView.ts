import { useCallback, useEffect, useState } from "react";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export type View = { kind: "chat"; uuid: string | null } | { kind: "images" };

function parsePath(pathname: string): View {
  if (pathname === "/images" || pathname === "/images/") {
    return { kind: "images" };
  }
  const match = pathname.match(/^\/conversation\/([^/]+)\/?$/);
  if (match && UUID_RE.test(match[1])) {
    return { kind: "chat", uuid: match[1] };
  }
  return { kind: "chat", uuid: null };
}

function pathFor(view: View): string {
  if (view.kind === "images") return "/images";
  return view.uuid ? `/conversation/${view.uuid}` : "/";
}

export function useView(): [View, (next: View) => void] {
  const [view, setView] = useState<View>(() =>
    parsePath(window.location.pathname)
  );

  useEffect(() => {
    const onPop = () => setView(parsePath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: View) => {
    const path = pathFor(next);
    if (path !== window.location.pathname) {
      window.history.pushState(null, "", path);
    }
    setView(next);
  }, []);

  return [view, navigate];
}
