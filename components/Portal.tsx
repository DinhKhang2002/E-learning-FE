// components/Portal.tsx
"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}