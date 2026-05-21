"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { StatsCardGradient } from "@/components/charts/StatsCard";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import Link from "next/link";

const AdminProdiChart = dynamic(
  () => import("@/components/charts/AdminProdiChart").then((m) => ({ default: m.AdminProdiChart })),
  { loading: () => <div className="skeleton h-80 w-full" />, ssr: false }
);

interface ProdiSaldoData { prodi: string; balance: number; }
interface Summary { totalSystemBalance: number; activeUsers: number; activeOperators: number; totalProdi: number; }
interface AuditLogEntry { id: string; action: string; detail: string; createdAt: string; actor?: { name: string } | null; }

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [saldoData, setSaldoData] = useState<ProdiSaldoData[]>([]);
  const [historyData, setHistoryData] = useState<Array<Record<string, string | number>>>([]);
  const [prodiList, setProdiList] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();
    
    async function fetchData() {
      try {
        const [prodiRes, auditRes] = await Promise.all([
          fetch("/api/admin/prodi-saldo-summary", { signal: abortController.signal }),
          fetch("/api/admin/audit?limit=5", { signal: abortController.signal }),
        ]);

        const prodiData = await prodiRes.json();
        const auditData = await auditRes.json();

        if (prodiData.success) {
          setSaldoData(prodiData.data.saldoData);
          setHistoryData(prodiData.data.historyData);
          setProdiList(prodiData.data.prodiList);
          setSummary(prodiData.data.summary);
        } else {
          throw new Error(prodiData.error || "Gagal mengambil data saldo");
        }

        if (auditData.success) {
          setAuditLogs(auditData.data || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || "Terjadi kesalahan saat memuat dashboard");
          console.error("Error fetching data:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    return () => abortController.abort();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="skeleton h-6 sm:h-8 w-2/3 sm:w-1/3"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 sm:h-32 w-full"></div>)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)]">Dashboard Admin</h1>
        <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">
          Selamat datang, {session?.user?.name?.split(" ")[0] || "Admin"}
        </p>
      </div>

      {error && (
        <div className="alert-danger mb-6">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
        <StatsCardGradient
          title="Total Sistem"
          value={formatRupiah(summary?.totalSystemBalance || 0)}
          className="col-span-2 sm:col-span-1"
        />
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-info-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm truncate">Users</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{summary?.activeUsers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-success-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm truncate">Operator</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{summary?.activeOperators || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm truncate">Prodi</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{summary?.totalProdi || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
        <AdminProdiChart saldoData={saldoData} type="bar" title="Saldo per Prodi" />
        {historyData.length > 0 && (
          <AdminProdiChart historyData={historyData} prodiList={prodiList} type="line" title="Tren Saldo (Tahunan)" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <div className="card-header">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">Aksi Cepat</h2>
          </div>
          <CardContent className="space-y-2 sm:space-y-3">
            <Link href="/admin/topup" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-success-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Validasi Top-up</p>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">Setujui atau tolak</p>
              </div>
            </Link>

            <Link href="/admin/operators" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-info-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Kelola Operator</p>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">Aktifkan/nonaktifkan</p>
              </div>
            </Link>

            <Link href="/admin/users" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Kelola Users</p>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">Manage mahasiswa</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">Audit Log</h2>
            <Link href="/admin/audit" className="text-xs sm:text-sm text-[var(--usg-primary)] hover:underline">Semua</Link>
          </div>
          <div className="divide-y divide-[var(--border-primary)] max-h-64 sm:max-h-80 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-[var(--text-muted)] text-sm">Belum ada aktivitas</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 sm:p-4 hover:bg-[var(--bg-hover)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] truncate max-w-[120px] sm:max-w-none">
                      {log.action}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[var(--text-secondary)] truncate">
                    {log.actor?.name || "System"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
