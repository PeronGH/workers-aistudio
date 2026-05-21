import { useCallback, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-mode") === "dark"
  );

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      const mode = next ? "dark" : "light";
      document.documentElement.setAttribute("data-mode", mode);
      document.documentElement.style.colorScheme = mode;
      localStorage.setItem("theme", mode);
      return next;
    });
  }, []);

  return { dark, toggle };
}
