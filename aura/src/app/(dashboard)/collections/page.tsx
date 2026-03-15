"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CollectionsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const { data: collections, isLoading } = trpc.collections.list.useQuery();

  const createMutation = trpc.collections.create.useMutation({
    onSuccess: () => {
      utils.collections.list.invalidate();
      setShowCreate(false);
      setName("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#f0f0f0] tracking-tight">
            Collections
          </h1>
          <p className="text-[#a0a0a0] mt-1">Organize your favorite creations</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 space-y-3">
          <div className="space-y-2">
            <Label>Collection Name</Label>
            <Input
              placeholder="My favorites"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  createMutation.mutate({ name: name.trim() });
                }
                if (e.key === "Escape") setShowCreate(false);
              }}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate({ name: name.trim() })}
              disabled={!name.trim() || createMutation.isPending}
              size="sm"
            >
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-[#7c5af5] animate-spin" />
        </div>
      ) : collections?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <FolderOpen className="h-12 w-12 text-[#2a2a2a]" />
          <p className="text-[#a0a0a0]">No collections yet</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections?.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group rounded-xl border border-[#2a2a2a] bg-[#141414] overflow-hidden hover:border-[#7c5af5]/50 transition-colors"
            >
              {/* Preview grid */}
              <div className="grid grid-cols-2 gap-0.5 aspect-square bg-[#0a0a0a]">
                {collection.items.slice(0, 4).map((item, i) => (
                  <div key={i} className="relative bg-[#1c1c1c]">
                    {item.generation.thumbnailUrl && (
                      <Image
                        src={item.generation.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - (collection.items.length ?? 0)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[#1c1c1c]" />
                ))}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-[#f0f0f0] truncate">
                  {collection.name}
                </p>
                <p className="text-xs text-[#606060] mt-0.5">
                  {collection._count.items} item{collection._count.items !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
