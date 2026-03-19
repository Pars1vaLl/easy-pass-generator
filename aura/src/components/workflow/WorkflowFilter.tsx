"use client";

import { useState, useRef } from "react";
import { Search, X } from "lucide-react";
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
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCategory = (value: string | undefined) => {
    setActiveCategory(value);
    onCategoryChange(value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  const clearSearch = () => {
    setSearchValue("");
    onSearchChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060] pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={searchValue}
          onChange={handleSearch}
          placeholder="Search styles..."
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#141414] border border-[#2a2a2a] text-sm text-[#f0f0f0] placeholder:text-[#606060] focus:outline-none focus:ring-2 focus:ring-[#7c5af5]/50 focus:border-[#7c5af5] transition-all"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-[#2a2a2a] text-[#606060] hover:text-[#f0f0f0] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => handleCategory(value)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              activeCategory === value
                ? "bg-[#7c5af5] text-white shadow-md shadow-[#7c5af5]/30"
                : "bg-[#141414] text-[#a0a0a0] hover:bg-[#1c1c1c] hover:text-[#f0f0f0] border border-[#2a2a2a]"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
