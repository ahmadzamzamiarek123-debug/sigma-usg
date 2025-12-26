"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  relatedUser?: {
    name: string;
    identifier: string;
  };
}

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  async function fetchTransactions() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("type", filter);
      params.append("limit", "50");

      const res = await fetch(`/api/user/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "TOPUP":
        return "Top-up";
      case "PAYMENT":
        return "Pembayaran";
      case "TRANSFER_IN":
        return "Transfer Masuk";
      case "TRANSFER_OUT":
        return "Transfer Keluar";
      default:
        return type;
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case "TOPUP":
      case "TRANSFER_IN":
        return "text-[var(--color-success)]";
      case "PAYMENT":
      case "TRANSFER_OUT":
        return "text-[var(--color-danger)]";
      default:
        return "text-[var(--text-primary)]";
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "SUCCESS":
        return "badge badge-success";
      case "PENDING":
        return "badge badge-warning";
      case "FAILED":
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
          Riwayat Transaksi
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Lihat semua riwayat transaksi Anda
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Semua" },
            { value: "TOPUP", label: "Top-up" },
            { value: "PAYMENT", label: "Pembayaran" },
            { value: "TRANSFER_IN", label: "Transfer Masuk" },
            { value: "TRANSFER_OUT", label: "Transfer Keluar" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`btn btn-sm ${
                filter === f.value ? "btn-primary" : "btn-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        {isLoading ? (
          <div className="card-body flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--usg-primary)] border-t-transparent rounded-full"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-body text-center py-12">
            <p className="text-[var(--text-muted)]">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${getTypeColor(tx.type)}`}>
                        {getTypeLabel(tx.type)}
                      </span>
                      <span className={getStatusBadge(tx.status)}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                      {tx.description}
                    </p>
                    {tx.relatedUser && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {tx.type === "TRANSFER_IN" ? "Dari" : "Ke"}:{" "}
                        {tx.relatedUser.name}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTypeColor(tx.type)}`}>
                      {tx.type === "TOPUP" || tx.type === "TRANSFER_IN"
                        ? "+"
                        : "-"}
                      {formatRupiah(tx.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
