import { useCallback } from "react";
import { useLocalIndex } from "./useLocalIndex";

const INDEX_KEY = "wai-studio:playground";
const CONTENT_PREFIX = "wai-studio:playground:";

export function usePlaygroundStore() {
  const { index, add, remove, touch } = useLocalIndex(INDEX_KEY);

  const save = useCallback(
    (uuid: string, text: string) => {
      try {
        localStorage.setItem(CONTENT_PREFIX + uuid, text);
      } catch {
        /* quota — ignore */
      }
      touch(uuid);
    },
    [touch]
  );

  const load = useCallback((uuid: string): string => {
    try {
      return localStorage.getItem(CONTENT_PREFIX + uuid) ?? "";
    } catch {
      return "";
    }
  }, []);

  const create = useCallback(
    (title: string, text: string): string => {
      const uuid = crypto.randomUUID();
      add(uuid, title);
      try {
        localStorage.setItem(CONTENT_PREFIX + uuid, text);
      } catch {
        /* quota — ignore */
      }
      return uuid;
    },
    [add]
  );

  const del = useCallback(
    (uuid: string) => {
      remove(uuid);
      try {
        localStorage.removeItem(CONTENT_PREFIX + uuid);
      } catch {
        /* ignore */
      }
    },
    [remove]
  );

  return { index, create, save, load, del };
}
