"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/browser";

function tablesForPath(pathname: string) {
  if (pathname.startsWith("/appointments")) return ["appointments"];
  if (pathname.startsWith("/work-orders") || pathname.startsWith("/my-work")) return ["work_orders", "parts"];
  if (pathname.startsWith("/inventory")) return ["parts"];
  if (pathname.startsWith("/dashboard")) return ["appointments", "work_orders", "parts"];
  return [];
}

export function OperationalRealtime() {
  const pathname = usePathname();
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tables = tablesForPath(pathname);
    if (!tables.length) return;
    const supabase = createClient();
    const channel = supabase.channel(`operations:${pathname}`);
    const refresh = () => {
      if (refreshTimer.current) return;
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        router.refresh();
      }, 150);
    };
    tables.forEach((table) =>
      channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh),
    );
    channel.subscribe();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
      void supabase.removeChannel(channel);
    };
  }, [pathname, router]);

  return null;
}
