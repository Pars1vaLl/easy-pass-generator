"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Ban, Check, Loader2 } from "lucide-react"

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const utils = trpc.useUtils()

  const { data: users, isLoading } = trpc.users.adminList.useQuery({
    search: search || undefined,
    limit: 50,
  })

  const banMutation = trpc.users.adminBan.useMutation({
    onSuccess: () => utils.users.adminList.invalidate(),
  })

  const unbanMutation = trpc.users.adminUnban.useMutation({
    onSuccess: () => utils.users.adminList.invalidate(),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-[#f0f0f0]">Users</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
        <Input
          placeholder="Search by email, phone, or name..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 text-[#7c5af5] animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Generations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="text-[#f0f0f0] font-medium">{user.name ?? "—"}</p>
                      <p className="text-[#606060] text-xs">{user.email ?? user.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-[#a0a0a0]">{user.credits}</TableCell>
                  <TableCell className="text-[#a0a0a0]">
                    {user._count.generations}
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                    {user.role === "ADMIN" && (
                      <Badge className="ml-1">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.banned ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-400 hover:text-green-300"
                        onClick={() => unbanMutation.mutate({ userId: user.id })}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          const reason = prompt("Ban reason:")
                          if (reason) banMutation.mutate({ userId: user.id, reason })
                        }}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
