"use client"

import { useState, useRef } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
] as const

interface WorkflowFilterProps {
  onCategoryChange: (category: string | undefined) => void
  onSearchChange: (search: string) => void
}

export function WorkflowFilter({ onCategoryChange, onSearchChange }: WorkflowFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [searchValue, setSearchValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCategory = (value: string | undefined) => {
    setActiveCategory(value)
    onCategoryChange(value)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchValue(val)
    onSearchChange(val)
  }

  const clearSearch = () => {
    setSearchValue("")
    onSearchChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060] pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          value={searchValue}
          onChange={handleSearch}
          placeholder="Search styles..."
          className="w-full pl-9 pr-8 bg-[#141414] border-[#2a2a2a]"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-[#2a2a2a] text-[#606060] hover:text-[#f0f0f0]"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ value, label }) => (
          <Button
            key={label}
            variant={activeCategory === value ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategory(value)}
            className={cn(
              "flex-shrink-0 rounded-full",
              activeCategory === value
                ? "bg-[#7c5af5] hover:bg-[#6b47e8] text-white"
                : "bg-[#141414] hover:bg-[#1c1c1c] text-[#a0a0a0] hover:text-[#f0f0f0] border-[#2a2a2a]"
            )}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
