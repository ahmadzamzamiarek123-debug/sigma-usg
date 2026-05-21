"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Tagihan {
  id: string;
  title: string;
  description: string | null;
  jenis: string;
  prodiTarget: string | null;
  angkatanTarget: string | null;
  nominal: number;
  deadline: string;
  isActive: boolean;
  paidCount: number;
  totalPembayaran: number;
  createdAt: string;
}

interface StudentPayment {
  id: string;
  identifier: string;
  name: string;
  hasPaid: boolean;
  paidAt: string | null;
}

export default function OperatorTagihanPage() {
  const { data: session } = useSession();
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTagihan, setDetailTagihan] = useState<Tagihan | null>(null);
  const [students, setStudents] = useState<StudentPayment[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jenis, setJenis] = useState("KAS");
  const [nominal, setNominal] = useState("");
  const [deadline, setDeadline] = useState("");

  // Real-time polling: fetch every 30 seconds
  useEffect(() => {
    fetchTagihan();

    const pollInterval = setInterval(() => {
      fetchTagihan();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, []);

  async function fetchTagihan() {
    try {
      const res = await fetch("/api/operator/tagihan");
      const data = await res.json();
      setTagihan(data.data || []);
    } catch (error) {
      console.error("Error fetching tagihan:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteTagihan() {
    if (!selectedTagihan) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/tagihan/${selectedTagihan.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Tagihan berhasil dihapus" });
        setShowDeleteModal(false);
        setSelectedTagihan(null);
        fetchTagihan();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsDeleting(false);
    }
  }

  async function fetchTagihanDetail(tagihanId: string) {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/tagihan/${tagihanId}/detail`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.students || []);
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function openDetailModal(t: Tagihan) {
    setDetailTagihan(t);
    setShowDetailModal(true);
    fetchTagihanDetail(t.id);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setJenis("KAS");
    setNominal("");
    setDeadline("");
  }

  async function handleCreateTagihan(e: React.FormEvent) {
    e.preventDefault();
    
    if(Number(nominal) <= 0) {
      setResult({ success: false, message: "Nominal harus lebih dari 0" });
      return;
    }
    
    if(new Date(deadline) < new Date(new Date().setHours(0,0,0,0))) {
      setResult({ success: false, message: "Deadline tidak boleh di masa lalu" });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/operator/tagihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          jenis,
          nominal: Number(nominal),
          deadline,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Tagihan berhasil dibuat" });
        resetForm();
        setShowCreateModal(false);
        fetchTagihan();
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const jenisOptions = [
    { value: "KAS", label: "Kas" },
    { value: "ACARA", label: "Acara" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "OTHER", label: "Lainnya" },
  ];

  const jenisColors: Record<string, string> = {
    KAS: "bg-[var(--color-info)] text-[var(--text-inverse)]",
    ACARA: "bg-[var(--usg-primary)] text-[var(--text-inverse)]",
    SEMINAR: "bg-[var(--color-success)] text-[var(--text-inverse)]",
    OTHER: "bg-[var(--text-muted)] text-[var(--text-inverse)]",
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="skeleton h-64 w-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kelola Tagihan</h1>
          <p className="text-[var(--text-muted)] mt-1">
            Tagihan untuk {session?.user?.prodi} - Angkatan{" "}
            {session?.user?.angkatan}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buat Tagihan
        </Button>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? "alert-success" : "alert-danger"}`}>
          {result.message}
        </div>
      )}

      {tagihan.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)]">Belum ada tagihan</p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Buat Tagihan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tagihan.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${jenisColors[t.jenis]}`}>
                    {t.jenis}
                  </span>
                  <Badge variant={t.isActive ? "success" : "default"}>
                    {t.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-[var(--usg-primary)]">
                    {formatRupiah(t.nominal)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-[var(--text-muted)]">
                  <p>Target: {t.angkatanTarget || "Semua angkatan"}</p>
                  <p>Deadline: {formatDate(t.deadline)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--text-secondary)]">
                      Sudah Bayar
                    </span>
                    <span className="font-semibold text-[var(--color-success)]">
                      {t.paidCount} orang
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => openDetailModal(t)}>
                      Lihat Detail
                    </Button>
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => { setSelectedTagihan(t); setShowDeleteModal(true); }}>
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat Tagihan Baru" size="lg">
        <form onSubmit={handleCreateTagihan} className="space-y-4">
          <Input label="Judul Tagihan" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Kas Mingguan - Desember 2024" required />
          <Textarea label="Deskripsi (opsional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Keterangan tambahan tentang tagihan" rows={2} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Jenis Tagihan" value={jenis} onChange={(e) => setJenis(e.target.value)} options={jenisOptions} />
            <Input label="Nominal (Rp)" type="number" min="1" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="Contoh: 50000" required />
          </div>

          <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />

          <div className="p-3 bg-[var(--color-info-light)] rounded-lg">
            <p className="text-sm text-[var(--color-info)]">
              📌 Tagihan ini akan otomatis dikirim ke semua mahasiswa{" "}
              <strong>{session?.user?.prodi}</strong> angkatan{" "}
              <strong>{session?.user?.angkatan}</strong>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">Batal</Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">Buat Tagihan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedTagihan(null); }} title="Hapus Tagihan">
        {selectedTagihan && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-danger-light)] rounded-xl">
              <p className="text-sm text-[var(--color-danger)]">
                Apakah Anda yakin ingin menghapus tagihan berikut?
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <p className="font-semibold text-[var(--text-primary)]">{selectedTagihan.title}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{formatRupiah(selectedTagihan.nominal)}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedTagihan(null); }} className="flex-1">Batal</Button>
              <Button variant="danger" onClick={handleDeleteTagihan} isLoading={isDeleting} className="flex-1">Ya, Hapus Permanen</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setDetailTagihan(null); setStudents([]); }} title={detailTagihan?.title || "Detail Tagihan"} size="lg">
        {detailTagihan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--bg-tertiary)] rounded-xl">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Nominal</p>
                <p className="font-semibold text-[var(--usg-primary)]">{formatRupiah(detailTagihan.nominal)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Deadline</p>
                <p className="font-semibold text-[var(--text-primary)]">{formatDate(detailTagihan.deadline)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Target</p>
                <p className="font-semibold text-[var(--text-primary)]">{detailTagihan.prodiTarget || "Semua"} - {detailTagihan.angkatanTarget || "Semua"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Progress</p>
                <p className="font-semibold text-[var(--color-success)]">{students.filter((s) => s.hasPaid).length} / {students.length} Bayar</p>
              </div>
            </div>

            <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {isLoadingDetail ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--usg-primary)] border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-[var(--text-muted)] mt-2">Memuat data...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Tidak ada mahasiswa dalam target</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">NIM</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Nama</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-[var(--bg-hover)]">
                          <td className="px-4 py-2 text-sm font-mono text-[var(--text-primary)]">{student.identifier}</td>
                          <td className="px-4 py-2 text-sm text-[var(--text-primary)]">{student.name}</td>
                          <td className="px-4 py-2">
                            <Badge variant={student.hasPaid ? "success" : "danger"}>
                              {student.hasPaid ? "Lunas" : "Belum"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowDetailModal(false); setDetailTagihan(null); setStudents([]); }} className="flex-1">Tutup</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
