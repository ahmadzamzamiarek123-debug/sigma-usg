"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils";

interface User {
  id: string;
  identifier: string;
  name: string;
  prodi: string | null;
  angkatan: string | null;
  isActive: boolean;
  createdAt: string;
  balance: { balance: number } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [prodiList, setProdiList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<
    "toggle" | "reset" | "prodi" | "add-balance" | null
  >(null);
  const [newProdi, setNewProdi] = useState("");
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    identifier: "",
    name: "",
    prodi: "",
    angkatan: "",
    password: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState(""); // Support for name, nim
  const [filterProdi, setFilterProdi] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Available scopes from existing operators
  const [availableScopes, setAvailableScopes] = useState<{
    prodiList: string[];
    angkatanByProdi: Record<string, string[]>;
  }>({ prodiList: [], angkatanByProdi: {} });

  useEffect(() => {
    // Add debounce for search query
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterProdi, filterStatus, page]);

  useEffect(() => {
    if (showCreateModal) {
      fetchAvailableScopes();
    }
  }, [showCreateModal]);

  async function fetchAvailableScopes() {
    try {
      const res = await fetch("/api/admin/available-scopes");
      const data = await res.json();
      if (data.success) {
        setAvailableScopes(data.data);
      }
    } catch (error) {
      console.error("Error fetching available scopes:", error);
    }
  }

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (filterProdi) params.append("prodi", filterProdi);
      if (filterStatus) params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setProdiList(data.prodiList || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction() {
    if (!selectedUser || !actionType) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const body: { action: string; prodi?: string; amount?: number } = {
        action: "",
      };
      if (actionType === "toggle") body.action = "toggle-active";
      if (actionType === "reset") body.action = "reset-password";
      if (actionType === "prodi") {
        body.action = "change-prodi";
        body.prodi = newProdi;
      }
      if (actionType === "add-balance") {
        body.action = "add-balance";
        body.amount = parseInt(addBalanceAmount);
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        setSelectedUser(null);
        setActionType(null);
        setNewProdi("");
        setAddBalanceAmount("");
        fetchUsers();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    
    if (newUser.password.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }
    setPasswordError("");
    
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        setShowCreateModal(false);
        setNewUser({
          identifier: "",
          name: "",
          prodi: "",
          angkatan: "",
          password: "",
        });
        fetchUsers();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Kelola Users
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">
            Manage semua mahasiswa dalam sistem
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah User
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="w-full sm:flex-1">
              <Input
                label="Cari User"
                placeholder="Cari berdasarkan NIM atau Nama..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Prodi"
                value={filterProdi}
                onChange={(e) => {
                  setFilterProdi(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Prodi" },
                  ...prodiList.map((p) => ({ value: p, label: p })),
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "active", label: "Aktif" },
                  { value: "inactive", label: "Nonaktif" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className={`mb-6 p-3 sm:p-4 rounded-xl text-sm ${result.success ? "alert-success" : "alert-danger"}`}>
          {result.message}
        </div>
      )}

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table min-w-[700px]">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>Prodi</th>
                <th>Saldo</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--usg-primary)] border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[var(--text-muted)]"
                  >
                    Tidak ada user.{" "}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-[var(--color-info)] hover:underline"
                    >
                      Buat user baru
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-[var(--text-primary)]">{u.identifier}</td>
                    <td className="font-medium text-[var(--text-primary)]">{u.name}</td>
                    <td className="text-[var(--text-secondary)]">{u.prodi || "-"}</td>
                    <td className="font-medium text-[var(--text-primary)]">{formatRupiah(u.balance?.balance || 0)}</td>
                    <td>
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={u.isActive ? "danger" : "primary"}
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("toggle");
                          }}
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("reset");
                          }}
                        >
                          Reset PW
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType("add-balance");
                          }}
                        >
                          + Saldo
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-[var(--border-primary)] flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah User Baru"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="NIM (8 digit)"
            value={newUser.identifier}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                identifier: e.target.value.replace(/\D/g, "").slice(0, 8),
              })
            }
            placeholder="Contoh: 20230001"
            maxLength={8}
            required
          />

          <Input
            label="Nama Lengkap"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Nama mahasiswa"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prodi"
              value={newUser.prodi}
              onChange={(e) => {
                setNewUser({ ...newUser, prodi: e.target.value, angkatan: "" });
              }}
              options={[
                { value: "", label: "Pilih Prodi" },
                ...availableScopes.prodiList.map((p) => ({
                  value: p,
                  label: p,
                })),
              ]}
              required
            />

            <Select
              label="Angkatan"
              value={newUser.angkatan}
              onChange={(e) =>
                setNewUser({ ...newUser, angkatan: e.target.value })
              }
              options={[
                {
                  value: "",
                  label: newUser.prodi ? "Pilih Angkatan" : "Pilih prodi dulu",
                },
                ...(newUser.prodi &&
                availableScopes.angkatanByProdi[newUser.prodi]
                  ? availableScopes.angkatanByProdi[newUser.prodi].map((a) => ({
                      value: a,
                      label: `Angkatan ${a}`,
                    }))
                  : []),
              ]}
              disabled={!newUser.prodi}
              required
            />
          </div>

          {availableScopes.prodiList.length === 0 && (
            <div className="alert-warning text-sm mt-2">
              ⚠️ Belum ada Operator aktif. Buat Operator terlebih dahulu sebelum menambah User.
            </div>
          )}

          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => {
              setNewUser({ ...newUser, password: e.target.value })
              setPasswordError("");
            }}
            placeholder="Minimal 6 karakter"
            error={passwordError}
            required
          />

          <p className="text-xs text-[var(--text-muted)]">
            PIN default: <span className="font-mono">123456</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:flex-1 order-2 sm:order-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full sm:flex-1 order-1 sm:order-2"
            >
              Buat User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedUser && !!actionType}
        onClose={() => {
          setSelectedUser(null);
          setActionType(null);
          setNewProdi("");
        }}
        title={
          actionType === "toggle"
            ? selectedUser?.isActive
              ? "Nonaktifkan User"
              : "Aktifkan User"
            : actionType === "reset"
            ? "Reset Password"
            : actionType === "add-balance"
            ? "Tambah Saldo"
            : "Ubah Prodi"
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-medium">{selectedUser.name}</span>
                <br />
                <span className="text-[var(--text-secondary)]">{selectedUser.identifier}</span>
              </p>
            </div>

            {actionType === "toggle" && (
              <p className="text-sm text-[var(--text-secondary)]">
                User ini akan{" "}
                {selectedUser.isActive ? "dinonaktifkan" : "diaktifkan"}.
                {selectedUser.isActive && " User tidak akan bisa login."}
              </p>
            )}

            {actionType === "reset" && (
              <p className="text-sm text-[var(--text-secondary)]">
                Password akan direset ke{" "}
                <span className="font-mono font-medium">password123</span>
              </p>
            )}

            {actionType === "prodi" && (
              <Input
                label="Prodi Baru"
                value={newProdi}
                onChange={(e) => setNewProdi(e.target.value.toUpperCase())}
                placeholder="Contoh: TI, SI, MI"
              />
            )}

            {actionType === "add-balance" && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Saldo saat ini:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatRupiah(selectedUser.balance?.balance || 0)}
                  </span>
                </p>
                <Input
                  label="Jumlah Saldo (Rp)"
                  type="number"
                  value={addBalanceAmount}
                  onChange={(e) => setAddBalanceAmount(e.target.value)}
                  placeholder="Contoh: 100000"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant={
                  actionType === "toggle" && selectedUser.isActive
                    ? "danger"
                    : "primary"
                }
                onClick={handleAction}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
