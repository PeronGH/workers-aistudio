import { Button, Text } from "@cloudflare/kumo";
import { CircleIcon, ListIcon, SlidersIcon } from "@phosphor-icons/react";

interface HeaderProps {
  isStreaming: boolean;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
}

export function Header({
  isStreaming,
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
