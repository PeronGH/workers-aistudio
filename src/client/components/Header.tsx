import { Badge, Button, Switch, Text } from "@cloudflare/kumo";
import {
  BugIcon,
  ChatCircleDotsIcon,
  CircleIcon,
  ListIcon
} from "@phosphor-icons/react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  isStreaming: boolean;
  showDebug: boolean;
  onToggleDebug: (next: boolean) => void;
  onOpenSidebar: () => void;
}

export function Header({
  isStreaming,
  showDebug,
  onToggleDebug,
  onOpenSidebar
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
          <h1 className="text-lg font-semibold text-kumo-default">
            <span className="mr-2">⛅</span>Workers AI Studio
          </h1>
          <Badge variant="secondary">
            <ChatCircleDotsIcon size={12} weight="bold" className="mr-1" />
            Playground
          </Badge>
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
          <div className="flex items-center gap-1.5">
            <BugIcon size={14} className="text-kumo-inactive" />
            <Switch
              checked={showDebug}
              onCheckedChange={onToggleDebug}
              size="sm"
              aria-label="Toggle debug mode"
            />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
