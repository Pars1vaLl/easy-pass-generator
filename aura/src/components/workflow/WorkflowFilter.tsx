"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: undefined, label: "All" },
  { value: "PORTRAIT", label: "Portrait" },
  { value: "LANDSCAPE", label: "Landscape" },
  { value: "CINEMATIC", label: "Cinematic" },
  { value: "ANIME", label: "Anime" },
  { value: "ABSTRACT", label: "Abstract" },
  { value: "ARCHITECTURE", label: "Architecture" },
  { value: "PRODUCT", label: "Product" },
  { value: "FASHION", label: "Fashion" },
  { value: "VIDEO_CINEMATIC", label: "Video" },
] as const;

interface WorkflowFilterProps {
  onCategoryChange: (category: string | undefined) => void;
  onSearchChange: (search: string) => void;
}

export function WorkflowFilter({ onCategoryChange, onSearchChange }: WorkflowFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  const handleCategory = (value: string | undefined) => {
    setActiveCategory(value);
    onCategoryChange(value);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map(({ value, label }) => (
        <button
          key={label}
          onClick={() => handleCategory(value)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
            activeCategory === value
              ? "bg-[#7c5af5] text-white"
              : "bg-[#141414] text-[#a0a0a0] hover:bg-[#1c1c1c] hover:text-[#f0f0f0] border border-[#2a2a2a]"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
