import { z } from "zod";
import {
  MessageNodeSchema,
  UiMessageSchema,
  type MessageNode
} from "./messages";
import { RunSettingsSchema } from "./settings";

export const CURRENT_VERSION = 2;

// ── V2 (current) ─────────────────────────────────────────────────────────

export const ConversationStateV2Schema = z.object({
  version: z.literal(2),
  rootIds: z.array(z.string()),
  selectedRootId: z.string().nullable(),
  nodes: z.record(z.string(), MessageNodeSchema),
  settings: RunSettingsSchema
});

export type ConversationStateV2 = z.infer<typeof ConversationStateV2Schema>;

// Public alias for the client — the shape it reads, writes, and renders.
export const ConversationStateSchema = ConversationStateV2Schema;
export type ConversationState = ConversationStateV2;

// ── V1 (legacy, read-only on the server) ─────────────────────────────────

export const ConversationStateV1Schema = z.object({
  version: z.literal(1),
  messages: z.array(UiMessageSchema),
  settings: RunSettingsSchema
});

export type ConversationStateV1 = z.infer<typeof ConversationStateV1Schema>;

// ── Stored union + migration (server-only) ───────────────────────────────

export const StoredSchema = z.discriminatedUnion("version", [
  ConversationStateV1Schema,
  ConversationStateV2Schema
]);

export type StoredConversation = z.infer<typeof StoredSchema>;

export function migrate(stored: StoredConversation): ConversationStateV2 {
  if (stored.version === 2) return stored;
  const nodes: Record<string, MessageNode> = {};
  const ids = stored.messages.map((m) => m.id);
  stored.messages.forEach((m, i) => {
    nodes[m.id] = {
      id: m.id,
      parentId: i === 0 ? null : ids[i - 1],
      message: m,
      childIds: i < ids.length - 1 ? [ids[i + 1]] : [],
      selectedChildId: i < ids.length - 1 ? ids[i + 1] : null
    };
  });
  return {
    version: 2,
    rootIds: ids.length ? [ids[0]] : [],
    selectedRootId: ids[0] ?? null,
    nodes,
    settings: stored.settings
  };
}

// ── Tree helpers ─────────────────────────────────────────────────────────

export interface PathEntry {
  node: MessageNode;
  siblings: string[]; // ids of all siblings at this level, in order
  siblingIndex: number;
}

export function emptyState(
  settings: ConversationState["settings"] = {}
): ConversationStateV2 {
  return {
    version: 2,
    rootIds: [],
    selectedRootId: null,
    nodes: {},
    settings
  };
}

export function pathFromTree(state: ConversationStateV2): PathEntry[] {
  const out: PathEntry[] = [];
  let currentId: string | null = state.selectedRootId;
  let siblings: string[] = state.rootIds;
  while (currentId) {
    const node = state.nodes[currentId];
    if (!node) break;
    out.push({
      node,
      siblings,
      siblingIndex: siblings.indexOf(currentId)
    });
    currentId = node.selectedChildId;
    siblings = node.childIds;
  }
  return out;
}

/** Append a node as a child of `parentId` (or root if null). Mutates state. */
export function appendNode(
  state: ConversationStateV2,
  parentId: string | null,
  node: MessageNode
): void {
  state.nodes[node.id] = node;
  if (parentId === null) {
    state.rootIds.push(node.id);
    state.selectedRootId = node.id;
  } else {
    const parent = state.nodes[parentId];
    if (!parent) throw new Error(`parent ${parentId} not found`);
    parent.childIds.push(node.id);
    parent.selectedChildId = node.id;
  }
}

/** Update the displayed-child pointer for a node. `nodeId === null` updates the root selection. */
export function selectChildOf(
  state: ConversationStateV2,
  parentId: string | null,
  childId: string
): void {
  if (parentId === null) {
    if (state.rootIds.includes(childId)) state.selectedRootId = childId;
    return;
  }
  const parent = state.nodes[parentId];
  if (parent && parent.childIds.includes(childId)) {
    parent.selectedChildId = childId;
  }
}

/** Deep-clone state (structuredClone fallback). */
export function cloneState(state: ConversationStateV2): ConversationStateV2 {
  return structuredClone(state);
}
