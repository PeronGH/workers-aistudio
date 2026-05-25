import { Button, Text } from "@cloudflare/kumo";
import {
  CircleIcon,
  EyeSlashIcon,
  ListIcon,
  SlidersIcon
} from "@phosphor-icons/react";

interface HeaderProps {
  isStreaming: boolean;
  anonymousMode: boolean;
  anonymousDisabled: boolean;
  onToggleAnonymous: () => void;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
}

export function Header({
  isStreaming,
  anonymousMode,
  anonymousDisabled,
  onToggleAnonymous,
  onOpenSidebar,
  onOpenSettings
}: HeaderProps) {
  return (
    <header className="px-5 py-4 bg-kumo-base border-b border-kumo-line">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            shape="square"
            aria-label="Open sidebar"
            icon={<ListIcon size={16} />}
            onClick={onOpenSidebar}
            className="md:hidden"
          />
          <h1 className="text-lg font-semibold text-kumo-default">AI Studio</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CircleIcon
              size={8}
              weight="fill"
              className={isStreaming ? "text-kumo-brand" : "text-kumo-inactive"}
            />
            <Text size="xs" variant="secondary">
              {isStreaming ? "Streaming" : "Idle"}
            </Text>
          </div>
          <Button
            variant={anonymousMode ? "primary" : "ghost"}
            shape="square"
            aria-label={
              anonymousMode
                ? "Turn anonymous mode off"
                : "Turn anonymous mode on"
            }
            aria-pressed={anonymousMode}
            title={anonymousMode ? "Anonymous mode on" : "Anonymous mode off"}
            icon={
              <EyeSlashIcon
                size={16}
                weight={anonymousMode ? "fill" : "regular"}
              />
            }
            onClick={onToggleAnonymous}
            disabled={anonymousDisabled}
            className={
              anonymousMode ? "" : "bg-kumo-control/60 hover:bg-kumo-control"
            }
          />
          <Button
            variant="ghost"
            shape="square"
            aria-label="Open settings"
            icon={<SlidersIcon size={16} />}
            onClick={onOpenSettings}
            className="md:hidden"
          />
        </div>
      </div>
    </header>
  );
}
