import { Button, Text } from "@cloudflare/kumo";
import {
  ChatCircleDotsIcon,
  PencilSimpleLineIcon,
  TrashIcon
} from "@phosphor-icons/react";
import type { ConversationIndexEntry } from "../hooks/useConversations";
import { formatRelative } from "../utils/relativeTime";

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
    <>
      <div className="px-3 py-2 border-b border-kumo-line">
        <Button
          variant="secondary"
          icon={<PencilSimpleLineIcon size={14} />}
          onClick={onNewChat}
          className="w-full"
        >
          New chat
        </Button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {entries.length === 0 && (
          <li className="px-2 py-6 text-center">
            <Text size="xs" variant="secondary">
              No conversations yet.
            </Text>
          </li>
        )}
        {entries.map((entry) => (
          <ChatRow
            key={entry.uuid}
            entry={entry}
            active={entry.uuid === activeUuid}
            onSelect={() => onSelect(entry.uuid)}
            onDelete={() => onDelete(entry.uuid)}
          />
        ))}
      </ul>
    </>
  );
}

function ChatRow({
  entry,
  active,
  onSelect,
  onDelete
}: {
  entry: ConversationIndexEntry;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const title = entry.title || "Chat";
  return (
    <li
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-1 pr-1 rounded-md transition-colors border-l-2 ${
        active
          ? "border-kumo-brand bg-kumo-brand/10"
          : "border-transparent hover:bg-kumo-control/50"
      }`}
    >
      <Button
        variant="ghost"
        size="xs"
        onClick={onSelect}
        className="h-auto flex-1 min-w-0 justify-start gap-2 rounded-none bg-transparent pl-2 pr-1 py-1.5 text-left font-normal shadow-none hover:bg-transparent"
      >
        <ChatCircleDotsIcon
          size={14}
          className={`shrink-0 ${active ? "text-kumo-brand" : "text-kumo-inactive"}`}
        />
        <div className="flex-1 min-w-0">
          <div
            className={`truncate text-sm ${active ? "font-medium text-kumo-default" : "font-normal text-kumo-default/80"}`}
          >
            {title}
          </div>
          <div className="text-[10px] text-kumo-subtle">
            {formatRelative(entry.updatedAt)}
          </div>
        </div>
      </Button>
      <Button
        variant="ghost"
        shape="square"
        size="xs"
        aria-label="Delete conversation"
        icon={<TrashIcon size={12} />}
        onClick={() => {
          if (confirm(`Delete "${title}"?`)) onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-kumo-inactive hover:text-kumo-danger transition-opacity"
      />
    </li>
  );
}
