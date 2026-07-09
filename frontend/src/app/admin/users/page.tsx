"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllUsers, updateUserStatus } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllUsers({
        page,
        limit: 20,
        search: search || undefined,
      });
      setUsers(data.users);
      setPages(data.pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleToggleActive = async (user: User) => {
    setActionId(user.id);
    setError(null);

    try {
      await updateUserStatus(user.id, !user.isActive);
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update user status",
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900">Users</h1>

      <form onSubmit={handleSearch} className="mt-6 flex max-w-md gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email..."
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" label="Loading users" />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-100">
                      <td className="px-4 py-4 font-medium text-zinc-900">
                        {user.name}
                      </td>
                      <td className="px-4 py-4 text-zinc-600">{user.email}</td>
                      <td className="px-4 py-4">
                        <Badge variant={user.role === "admin" ? "info" : "neutral"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          disabled={actionId === user.id}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={pages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      )}
    </div>
  );
}
