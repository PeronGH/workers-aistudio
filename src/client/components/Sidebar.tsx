import { Button, Text } from "@cloudflare/kumo";
import {
  ChatCircleDotsIcon,
  PencilSimpleLineIcon,
  TrashIcon,
  XIcon
} from "@phosphor-icons/react";
import type { ConversationIndexEntry } from "../hooks/useConversations";

interface SidebarProps {
  entries: ConversationIndexEntry[];
  activeUuid: string | null;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onNewChat: () => void;
  onSelect: (uuid: string) => void;
  onDelete: (uuid: string) => void;
}

export function Sidebar({
  entries,
  activeUuid,
  drawerOpen,
  onCloseDrawer,
  onNewChat,
  onSelect,
  onDelete
}: SidebarProps) {
  return (
    <>
      {drawerOpen && (
        <Button
          variant="ghost"
          aria-label="Close sidebar"
          onClick={onCloseDrawer}
          className="md:hidden fixed inset-0 z-30 h-auto w-auto rounded-none bg-black/40 p-0 shadow-none backdrop-blur-sm hover:bg-black/40 focus-visible:ring-0"
        />
      )}
      <aside
        className={`${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-kumo-line bg-kumo-base flex flex-col transition-transform`}
      >
        <div className="px-3 py-3 border-b border-kumo-line flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<PencilSimpleLineIcon size={14} />}
            onClick={() => {
              onNewChat();
              onCloseDrawer();
            }}
            className="flex-1"
          >
            New chat
          </Button>
          <Button
            variant="ghost"
            shape="square"
            size="sm"
            aria-label="Close sidebar"
            icon={<XIcon size={16} />}
            onClick={onCloseDrawer}
            className="md:hidden"
          />
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
            <SidebarRow
              key={entry.uuid}
              entry={entry}
              active={entry.uuid === activeUuid}
              onSelect={() => {
                onSelect(entry.uuid);
                onCloseDrawer();
              }}
              onDelete={() => onDelete(entry.uuid)}
            />
          ))}
        </ul>
      </aside>
    </>
  );
}

function SidebarRow({
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
  const title = entry.title || "Image";
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

const RTF = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000]
];

function formatRelative(ts: number): string {
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  for (const [unit, ms] of UNITS) {
    if (abs >= ms) return RTF.format(Math.round(diff / ms), unit);
  }
  return "just now";
}
