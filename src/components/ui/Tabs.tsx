"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function Tabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [id, setId] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="no-print flex gap-1 overflow-auto border-b border-stone-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setId(t.id)}
            className={cn(
              "whitespace-nowrap px-3 py-2 text-[13px] font-semibold",
              id === t.id ? "border-b-2 border-copper-600 text-stone-900" : "text-stone-500 hover:text-stone-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs.find((t) => t.id === id)?.content}</div>
    </div>
  );
}
