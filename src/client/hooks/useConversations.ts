import { useLocalIndex } from "./useLocalIndex";

export type { IndexEntry as ConversationIndexEntry } from "./useLocalIndex";

export function useConversations() {
  return useLocalIndex("wai-studio:conversations");
}
