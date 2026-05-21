import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@cloudflare/kumo";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <Button
      variant="secondary"
      shape="square"
      icon={dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      onClick={toggle}
      aria-label="Toggle theme"
    />
  );
}
