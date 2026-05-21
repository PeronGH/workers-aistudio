import { useCallback, useEffect, useState } from "react";

const UUID_RE = /^[0-9a-f-]{36}$/i;

function parsePath(pathname: string): string | null {
  const match = pathname.match(/^\/conversation\/([^/]+)\/?$/);
  if (!match) return null;
  return UUID_RE.test(match[1]) ? match[1] : null;
}

function pathFor(uuid: string | null): string {
  return uuid ? `/conversation/${uuid}` : "/";
}

export function useActiveUuid(): [
  string | null,
  (next: string | null) => void
] {
  const [uuid, setUuid] = useState<string | null>(() =>
    parsePath(window.location.pathname)
  );

  useEffect(() => {
    const onPop = () => setUuid(parsePath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: string | null) => {
    const path = pathFor(next);
    if (path !== window.location.pathname) {
      window.history.pushState(null, "", path);
    }
    setUuid(next);
  }, []);

  return [uuid, navigate];
}
