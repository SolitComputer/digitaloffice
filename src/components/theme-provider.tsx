"use client";

import type { ComponentProps } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes menyuntik <script> anti-FOUC supaya class tema kepasang sebelum paint.
// React 19 / Next 16 ngasih warning soal <script> di dalam komponen, padahal script-nya
// jalan normal saat SSR. Jadi ini false positive — kita bungkam khusus warning ini, dev only.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalError(...args);
  };
}

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}