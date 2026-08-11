"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const themeStorageKey = "autocare-theme";
const themeChangeEvent = "autocare-theme-change";

function subscribeToTheme(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  return () => window.removeEventListener(themeChangeEvent, callback);
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem(themeStorageKey, nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <Button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      size="icon"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
      variant="ghost"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </Button>
  );
}
