import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  newId,
  toApiMessages,
  type MessageNode,
  type UiAssistantMessage,
  type UiMessage,
  type UiUserMessage
} from "../../shared/messages";
import {
  appendNode,
  cloneState,
  emptyState,
  pathFromTree,
  selectChildOf,
  type ConversationState,
  type PathEntry
} from "../../shared/conversations";
import type { RunSettings } from "../../shared/settings";
import { parseSseStream } from "../utils/sse";
import { api } from "../utils/api";
import { toastError } from "../utils/toast";

interface ChatDelta {
  choices?: {
    delta?: { content?: string | null; reasoning_content?: string | null };
  }[];
}

interface SendArgs {
  uuid: string | null;
  text: string;
  images: { url: string; mediaType: string }[];
  settings: RunSettings;
}

interface EditArgs {
  uuid: string | null;
  nodeId: string;
  text: string;
  settings: RunSettings;
}

export function useChat(
  activeUuid: string | null,
  onLoaded?: (state: ConversationState) => void,
  persist = true
) {
  const [state, setState] = useState<ConversationState>(() => emptyState());
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef<ConversationState>(state);
  const localUuidsRef = useRef<Set<string>>(new Set());
  const onLoadedRef = useRef(onLoaded);
  const persistRef = useRef(persist);
  onLoadedRef.current = onLoaded;
  persistRef.current = persist;
  stateRef.current = state;

  const claimLocal = useCallback((uuid: string) => {
    localUuidsRef.current.add(uuid);
  }, []);

  // Load on uuid change
  useEffect(() => {
    if (activeUuid && localUuidsRef.current.has(activeUuid)) {
      localUuidsRef.current.delete(activeUuid);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);

    if (!persist) {
      setState(emptyState());
      setIsLoading(false);
      return;
    }

    if (!activeUuid) {
      setState(emptyState());
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const res = await api.api.conversations[":uuid"].$get({
          param: { uuid: activeUuid }
        });
        if (cancelled) return;
        if (res.status === 404) {
          setState(emptyState());
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const loaded = (await res.json()) as ConversationState;
        if (cancelled) return;
        setState(loaded);
        onLoadedRef.current?.(loaded);
      } catch (err) {
        if (!cancelled) {
          toastError("Couldn't load conversation", (err as Error).message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUuid, persist]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const resetChat = useCallback((settings?: RunSettings) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setIsLoading(false);
    setState(emptyState(settings));
  }, []);

  // ── Streaming primitive ───────────────────────────────────────────────
  const stream = useCallback(
    async (
      uuid: string | null,
      apiMessageNodes: MessageNode[],
      assistantNodeId: string,
      settings: RunSettings
    ): Promise<boolean> => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      let content = "";
      let reasoning = "";
      let completedNaturally = false;

      try {
        const apiMessages = toApiMessages(
          apiMessageNodes.map((n) => n.message)
        );
        const res = await api.api.chat.$post(
          { json: { messages: apiMessages, settings } },
          { init: { signal: controller.signal } }
        );
        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
        }
        for await (const event of parseSseStream(res.body)) {
          if (event.data === "[DONE]") {
            completedNaturally = true;
            break;
          }
          let delta: ChatDelta;
          try {
            delta = JSON.parse(event.data);
          } catch {
            continue;
          }
          const piece = delta.choices?.[0]?.delta;
          if (!piece) continue;
          const c = piece.content ?? "";
          const r = piece.reasoning_content ?? "";
          if (!c && !r) continue;
          content += c;
          if (r) reasoning += r;
          setState((prev) => {
            const node = prev.nodes[assistantNodeId];
            if (!node || node.message.role !== "assistant") return prev;
            return {
              ...prev,
              nodes: {
                ...prev.nodes,
                [assistantNodeId]: {
                  ...node,
                  message: {
                    ...node.message,
                    content,
                    reasoning: reasoning || undefined
                  }
                }
              }
            };
          });
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          toastError("Send failed", (err as Error).message);
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }

      if (completedNaturally && uuid && persistRef.current) {
        void putConversation(uuid, cloneState(stateRef.current));
      }
      return completedNaturally;
    },
    []
  );

  // ── Public actions ────────────────────────────────────────────────────

  const send = useCallback(
    async ({ uuid, text, images, settings }: SendArgs): Promise<boolean> => {
      if (isStreaming) return false;

      const path = pathFromTree(stateRef.current);
      const leafId = path.length ? path[path.length - 1].node.id : null;

      const userId = newId();
      const userMsg: UiUserMessage = {
        id: userId,
        role: "user",
        text,
        images
      };
      const userNode: MessageNode = {
        id: userId,
        parentId: leafId,
        message: userMsg,
        childIds: [],
        selectedChildId: null
      };
      const withUser = cloneState(stateRef.current);
      withUser.settings = settings;
      appendNode(withUser, leafId, userNode);
      setState(withUser);
      if (uuid && persistRef.current) void putConversation(uuid, withUser);

      const assistantId = newId();
      const assistantNode: MessageNode = {
        id: assistantId,
        parentId: userId,
        message: {
          id: assistantId,
          role: "assistant",
          content: ""
        } as UiAssistantMessage,
        childIds: [],
        selectedChildId: null
      };
      const withPlaceholder = cloneState(withUser);
      appendNode(withPlaceholder, userId, assistantNode);
      setState(withPlaceholder);

      const apiNodes = [...pathToNode(withUser, userId)];
      return stream(uuid, apiNodes, assistantId, settings);
    },
    [isStreaming, stream]
  );

  const retry = useCallback(
    async (
      uuid: string | null,
      assistantNodeId: string,
      settings: RunSettings
    ): Promise<boolean> => {
      if (isStreaming) return false;
      const current = stateRef.current;
      const original = current.nodes[assistantNodeId];
      if (!original || original.message.role !== "assistant") return false;
      const parentUserId = original.parentId;
      if (!parentUserId) return false;

      const newAssistantId = newId();
      const newAssistant: MessageNode = {
        id: newAssistantId,
        parentId: parentUserId,
        message: {
          id: newAssistantId,
          role: "assistant",
          content: ""
        } as UiAssistantMessage,
        childIds: [],
        selectedChildId: null
      };
      const next = cloneState(current);
      next.settings = settings;
      appendNode(next, parentUserId, newAssistant);
      setState(next);

      const apiNodes = pathToNode(next, parentUserId);
      return stream(uuid, apiNodes, newAssistantId, settings);
    },
    [isStreaming, stream]
  );

  const editUser = useCallback(
    async ({ uuid, nodeId, text, settings }: EditArgs): Promise<boolean> => {
      if (isStreaming) return false;
      const current = stateRef.current;
      const original = current.nodes[nodeId];
      if (!original || original.message.role !== "user") return false;

      const newUserId = newId();
      const newUserNode: MessageNode = {
        id: newUserId,
        parentId: original.parentId,
        message: {
          id: newUserId,
          role: "user",
          text,
          images: original.message.images
        },
        childIds: [],
        selectedChildId: null
      };
      const withUser = cloneState(current);
      withUser.settings = settings;
      appendNode(withUser, original.parentId, newUserNode);
      setState(withUser);
      if (uuid && persistRef.current) void putConversation(uuid, withUser);

      const assistantId = newId();
      const assistantNode: MessageNode = {
        id: assistantId,
        parentId: newUserId,
        message: {
          id: assistantId,
          role: "assistant",
          content: ""
        } as UiAssistantMessage,
        childIds: [],
        selectedChildId: null
      };
      const withPlaceholder = cloneState(withUser);
      appendNode(withPlaceholder, newUserId, assistantNode);
      setState(withPlaceholder);

      const apiNodes = pathToNode(withUser, newUserId);
      return stream(uuid, apiNodes, assistantId, settings);
    },
    [isStreaming, stream]
  );

  const selectSibling = useCallback(
    (uuid: string | null, parentId: string | null, childId: string) => {
      const next = cloneState(stateRef.current);
      selectChildOf(next, parentId, childId);
      setState(next);
      if (uuid && persistRef.current) void putConversation(uuid, next);
    },
    []
  );

  const path: PathEntry[] = useMemo(() => pathFromTree(state), [state]);
  const messages: UiMessage[] = useMemo(
    () => path.map((e) => e.node.message),
    [path]
  );

  return {
    state,
    path,
    messages,
    send,
    retry,
    editUser,
    selectSibling,
    stop,
    resetChat,
    claimLocal,
    isStreaming,
    isLoading
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function pathToNode(state: ConversationState, nodeId: string): MessageNode[] {
  const out: MessageNode[] = [];
  let cur: MessageNode | undefined = state.nodes[nodeId];
  while (cur) {
    out.push(cur);
    cur = cur.parentId ? state.nodes[cur.parentId] : undefined;
  }
  return out.reverse();
}

async function putConversation(
  uuid: string,
  state: ConversationState
): Promise<void> {
  try {
    await api.api.conversations[":uuid"].$put({
      param: { uuid },
      json: state
    });
  } catch {
    // Network error — silently drop. Next successful PUT will overwrite.
  }
}
