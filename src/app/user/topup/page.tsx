"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatRupiah, formatDateTime } from "@/lib/utils";

interface TopupRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  validatedAt: string | null;
}

const TOPUP_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function UserTopupPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [balanceRes, requestsRes] = await Promise.all([
        fetch("/api/user/balance"),
        fetch("/api/user/topup"),
      ]);

      const balanceData = await balanceRes.json();
      const requestsData = await requestsRes.json();

      setBalance(balanceData.data?.balance || 0);
      setRequests(requestsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const amount = selectedAmount || parseInt(customAmount);

    if (!amount || amount < 10000) {
      setResult({ success: false, message: "Jumlah minimal Rp 10.000" });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/user/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: "Permintaan top-up berhasil. Tunggu validasi admin.",
        });
        setSelectedAmount(0);
        setCustomAmount("");
        fetchData();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "APPROVED":
        return "badge badge-success";
      case "PENDING":
        return "badge badge-warning";
      case "REJECTED":
        return "badge badge-danger";
      default:
        return "badge";
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Top-up Saldo
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Isi saldo untuk melakukan pembayaran
        </p>
      </div>

      {/* Current Balance */}
      <div className="stats-card mb-6">
        <p className="text-sm text-[var(--text-muted)]">Saldo Saat Ini</p>
        <p className="stats-card-value text-[var(--usg-accent)]">
          {formatRupiah(balance)}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Request Top-up
            </h3>

            {result && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  result.success
                    ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                    : "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                }`}
              >
                {result.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Amount Buttons */}
              <div>
                <label className="input-label">Pilih Nominal</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TOPUP_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedAmount === amount
                          ? "border-[var(--usg-primary)] bg-[var(--usg-primary)] text-white"
                          : "border-[var(--border-primary)] hover:border-[var(--usg-primary)]"
                      }`}
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="input-label">Atau Nominal Lainnya</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  placeholder="Minimal Rp 10.000"
                  className="input"
                  min="10000"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!selectedAmount && !customAmount)}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? "Memproses..." : "Request Top-up"}
              </button>
            </form>

            <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">
                💡 Setelah request, hubungi admin untuk konfirmasi pembayaran.
                Saldo akan ditambahkan setelah admin memvalidasi.
              </p>
            </div>
          </div>
        </div>

        {/* Request History */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              Riwayat Request
            </h3>

            {isLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Memuat...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Belum ada request top-up
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 10).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {formatRupiah(req.amount)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDateTime(req.createdAt)}
                      </p>
                    </div>
                    <span className={getStatusBadge(req.status)}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
