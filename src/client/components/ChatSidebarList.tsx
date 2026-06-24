import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import type { ConversationIndexEntry } from "../hooks/useConversations";
import { SidebarList } from "./SidebarList";

interface ChatSidebarListProps {
  entries: ConversationIndexEntry[];
  activeUuid: string | null;
  onNewChat: () => void;
  onSelect: (uuid: string) => void;
  onDelete: (uuid: string) => void;
}

export function ChatSidebarList({
  entries,
  activeUuid,
  onNewChat,
  onSelect,
  onDelete
}: ChatSidebarListProps) {
  return (
    <SidebarList
      entries={entries}
      activeId={activeUuid}
      icon={ChatCircleDotsIcon}
      emptyLabel="No conversations yet."
      newLabel="New chat"
      onNew={onNewChat}
      onSelect={onSelect}
      onDelete={onDelete}
    />
  );
}
