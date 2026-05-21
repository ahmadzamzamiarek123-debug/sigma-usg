"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { PRODI_OPTIONS, ANGKATAN_OPTIONS } from "@/lib/constants";

interface Operator {
  id: string;
  identifier: string;
  name: string;
  prodi: string | null;
  angkatan: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminOperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [prodi, setProdi] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchOperators();
  }, []);

  async function fetchOperators() {
    try {
      const res = await fetch("/api/admin/operators");
      const data = await res.json();
      setOperators(data.data || []);
    } catch (error) {
      console.error("Error fetching operators:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setProdi("");
    setAngkatan("");
    setPassword("");
    setPasswordError("");
  }

  async function handleCreateOperator(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }
    setPasswordError("");
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prodi, angkatan, password }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: `Operator berhasil dibuat: ${data.data.identifier}`,
        });
        resetForm();
        setShowCreateModal(false);
        fetchOperators();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!togglingId) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/admin/operators/${togglingId}/toggle-active`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        fetchOperators();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setTogglingId(null);
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!resetId) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/operators/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password" }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setResetId(null);
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Kelola Operator
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">
            Tambah dan kelola operator
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
          Tambah Operator
        </Button>
      </div>

      {result && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm ${result.success ? "alert-success" : "alert-danger"}`}>
          {result.message}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 sm:h-48 skeleton"></div>
          ))}
        </div>
      ) : operators.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] text-sm sm:text-base">Belum ada operator</p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-3 sm:mt-4">Tambah Operator</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {operators.map((op) => (
            <Card key={op.id}>
              <CardContent className="p-4 sm:py-5">
                <div className="flex items-start gap-3 mb-3 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0 ${op.isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]'}`}>
                    {op.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base truncate">
                      {op.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono truncate">
                      {op.identifier}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                  <span className="badge badge-info">{op.prodi || "N/A"}</span>
                  <span className={`badge ${op.isActive ? 'badge-success' : 'badge-default'}`}>
                    {op.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)] mb-3 sm:mb-4">
                  {formatDateTime(op.createdAt)}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant={op.isActive ? "danger" : "primary"}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setTogglingId(op.id)}
                  >
                    {op.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setResetId(op.id)}
                  >
                    Reset PW
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal Status */}
      <Modal
        isOpen={!!togglingId}
        onClose={() => setTogglingId(null)}
        title="Konfirmasi Status Operator"
      >
        <p className="text-[var(--text-secondary)] mb-4">
          Apakah Anda yakin ingin mengubah status operator ini?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setTogglingId(null)} className="flex-1">Batal</Button>
          <Button onClick={handleToggleActive} isLoading={isSubmitting} className="flex-1">Ya, Lanjutkan</Button>
        </div>
      </Modal>

      {/* Confirmation Modal Reset PW */}
      <Modal
        isOpen={!!resetId}
        onClose={() => setResetId(null)}
        title="Reset Password Operator"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Apakah Anda yakin ingin meriset password operator ini ke password default?
          </p>
          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)]">
              Password baru: <span className="font-mono font-bold">password123</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setResetId(null)} className="flex-1">Batal</Button>
            <Button onClick={handleResetPassword} isLoading={isSubmitting} className="flex-1">Ya, Riset</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {setShowCreateModal(false); resetForm();}}
        title="Tambah Operator"
      >
        <form onSubmit={handleCreateOperator} className="space-y-3 sm:space-y-4">
          <Input
            label="Nama Operator"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Operator TI 2024"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Prodi"
              value={prodi}
              onChange={(e) => setProdi(e.target.value)}
              options={[{ value: "", label: "Pilih Prodi" }, ...PRODI_OPTIONS]}
              required
            />

            <Select
              label="Angkatan"
              value={angkatan}
              onChange={(e) => setAngkatan(e.target.value)}
              options={[{ value: "", label: "Pilih Tahun" }, ...ANGKATAN_OPTIONS]}
              required
            />
          </div>

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {setPassword(e.target.value); setPasswordError("");}}
            placeholder="Minimal 6 karakter"
            error={passwordError}
            required
          />

          <p className="text-xs text-[var(--text-muted)]">Format kode: OP-[PRODI]-XXXX</p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {setShowCreateModal(false); resetForm();}}
              className="w-full sm:flex-1 order-2 sm:order-1"
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:flex-1 order-1 sm:order-2">
              Buat Operator
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
