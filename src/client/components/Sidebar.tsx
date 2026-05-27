import type { ReactNode } from "react";
import { Button } from "@cloudflare/kumo";
import {
  ChatCircleDotsIcon,
  ImageSquareIcon,
  XIcon
} from "@phosphor-icons/react";

export type SidebarMode = "chat" | "images";

interface SidebarProps {
  mode: SidebarMode;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onSelectMode: (mode: SidebarMode) => void;
  children: ReactNode;
}

export function Sidebar({
  mode,
  drawerOpen,
  onCloseDrawer,
  onSelectMode,
  children
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
          <ModeButton
            label="Chat"
            icon={<ChatCircleDotsIcon size={14} />}
            active={mode === "chat"}
            onClick={() => onSelectMode("chat")}
          />
          <ModeButton
            label="Image Studio"
            icon={<ImageSquareIcon size={14} />}
            active={mode === "images"}
            onClick={() => onSelectMode("images")}
          />
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
        {children}
      </aside>
    </>
  );
}

function ModeButton({
  label,
  icon,
  active,
  onClick
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "primary" : "ghost"}
      size="xs"
      icon={icon}
      onClick={onClick}
      className={`flex-1 justify-center ${
        active ? "" : "text-kumo-default/80 hover:bg-kumo-control/60"
      }`}
    >
      {label}
    </Button>
  );
}
