"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah } from "@/lib/utils";

export default function TransferPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [toNim, setToNim] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; } | null>(null);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [recipient, setRecipient] = useState<{
    name: string;
    prodi: string | null;
    angkatan: string | null;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/user/balance");
        const data = await res.json();
        setBalance(data.data?.balance || 0);
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBalance();
  }, []);

  useEffect(() => {
    const lookupNim = async () => {
      if (toNim.length !== 8) {
        setRecipient(null);
        setLookupError(null);
        return;
      }
      
      if (toNim === session?.user?.identifier) {
        setRecipient(null);
        setLookupError("Tidak dapat transfer ke diri sendiri");
        return;
      }

      setIsLookingUp(true);
      setLookupError(null);

      try {
        const res = await fetch(`/api/user/lookup?nim=${toNim}`);
        const data = await res.json();

        if (data.success) {
          setRecipient(data.data);
          setLookupError(null);
        } else {
          setRecipient(null);
          setLookupError(data.error || "NIM tidak ditemukan");
        }
      } catch {
        setRecipient(null);
        setLookupError("Gagal mencari NIM");
      } finally {
        setIsLookingUp(false);
      }
    };

    const timer = setTimeout(lookupNim, 300);
    return () => clearTimeout(timer);
  }, [toNim, session?.user?.identifier]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (toNim === session?.user?.identifier) {
      setResult({ success: false, message: "Tidak dapat transfer ke diri sendiri" });
      return;
    }
    
    if (!toNim || !amount || !pin) {
      setResult({ success: false, message: "Semua field wajib harus diisi" });
      return;
    }
    
    if (!recipient) {
      setResult({ success: false, message: "NIM tujuan tidak valid" });
      return;
    }
    
    if (!/^\d{8}$/.test(toNim)) {
      setResult({ success: false, message: "NIM harus 8 digit angka" });
      return;
    }
    const numAmount = Number(amount);
    if (numAmount < 1000) {
      setResult({ success: false, message: "Nominal transfer minimal Rp 1.000" });
      return;
    }
    if (numAmount > balance) {
      setResult({ success: false, message: "Saldo tidak mencukupi" });
      return;
    }
    if (pin.length !== 6) {
      setResult({ success: false, message: "PIN harus 6 digit" });
      return;
    }
    if (message.length > 200) {
      setResult({ success: false, message: "Pesan maksimal 200 karakter" });
      return;
    }
    setResult(null);
    setShowConfirmModal(true);
  }

  async function handleConfirmTransfer() {
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/user/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toNim,
          amount: Number(amount),
          pin,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        setBalance(data.data.newBalance);
        setToNim("");
        setAmount("");
        setMessage("");
        setPin("");
        setRecipient(null);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-64 w-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transfer Saldo</h1>
        <p className="text-[var(--text-secondary)] mt-1">Kirim saldo ke sesama mahasiswa</p>
      </div>

      <Card variant="gradient" className="mb-8">
        <CardContent className="py-6">
          <p className="text-[var(--text-inverse)] opacity-80 text-sm mb-1">Saldo Tersedia</p>
          <p className="text-3xl font-bold text-[var(--text-inverse)]">
            {formatRupiah(balance)}
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="NIM Tujuan"
              type="text"
              placeholder="Masukkan 8 digit NIM"
              value={toNim}
              onChange={(e) => setToNim(e.target.value)}
              maxLength={8}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            {isLookingUp && (
              <div className="-mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg animate-pulse">
                <p className="text-sm text-[var(--text-secondary)]">
                  Mencari...
                </p>
              </div>
            )}
            {recipient && !isLookingUp && (
              <div className="-mt-3 p-3 bg-[var(--color-success-light)] rounded-lg border border-[var(--color-success)]">
                <p className="text-sm text-[var(--color-success)] font-medium">
                  ✓ {recipient.name}
                </p>
                <p className="text-xs text-[var(--color-success)] opacity-80 mt-1">
                  {recipient.prodi} - Angkatan {recipient.angkatan}
                </p>
              </div>
            )}
            {lookupError && !isLookingUp && toNim.length > 0 && (
              <div className="-mt-3 p-3 bg-[var(--color-danger-light)] rounded-lg border border-[var(--color-danger)]">
                <p className="text-sm text-[var(--color-danger)]">
                  ✗ {lookupError}
                </p>
              </div>
            )}

            <Input
              label="Nominal Transfer"
              type="number"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              icon={<span className="text-sm font-medium">Rp</span>}
            />

            <Textarea
              label="Pesan (opsional)"
              placeholder="Contoh: Bayar makan siang..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
              {message.length}/200
            </p>

            <Input
              label="PIN Transaksi"
              type="password"
              placeholder="Masukkan 6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {result && (
              <div className={`p-4 rounded-xl ${result.success ? "alert-success" : "alert-danger"}`}>
                {result.message}
              </div>
            )}

            <Button type="submit" className="w-full">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer Sekarang
            </Button>
          </form>
        </CardContent>
      </Card>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Konfirmasi Transfer"
      >
        <div className="space-y-4">
          <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Penerima</span>
              <span className="font-medium text-[var(--text-primary)]">{recipient?.name} ({toNim})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Nominal</span>
              <span className="font-semibold text-[var(--usg-primary)]">
                {formatRupiah(Number(amount))}
              </span>
            </div>
            {message.trim() && (
              <div className="pt-2 border-t border-[var(--border-primary)]">
                <span className="text-[var(--text-secondary)] text-sm block mb-1">Pesan</span>
                <p className="text-[var(--text-primary)] text-sm">{message}</p>
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--text-muted)] text-center">
            Pastikan data sudah benar. Transfer tidak dapat dibatalkan.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
