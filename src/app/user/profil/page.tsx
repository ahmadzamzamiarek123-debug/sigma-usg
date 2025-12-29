"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProfilPage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "pin">(
    "profile"
  );

  // Check if user must change password (first-time setup)
  const mustChangePassword = session?.user?.mustChangePassword === true;

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // PIN form
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Auto-switch to password tab if must change password
  useEffect(() => {
    if (mustChangePassword) {
      setActiveTab("password");
    }
  }, [mustChangePassword]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: "Password baru tidak sama" });
      return;
    }

    if (newPassword.length < 6) {
      setResult({ success: false, message: "Password minimal 6 karakter" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const body: { newPassword: string; currentPassword?: string } = {
        newPassword,
      };

      // Only include currentPassword if not first-time setup
      if (!mustChangePassword) {
        body.currentPassword = currentPassword;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Password berhasil diubah" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Refresh session if mustChangePassword was cleared
        if (data.mustChangePassword === false) {
          await update();
        }
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePinChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPin !== confirmPin) {
      setResult({ success: false, message: "PIN baru tidak sama" });
      return;
    }

    if (newPin.length !== 6) {
      setResult({ success: false, message: "PIN harus 6 digit" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "PIN berhasil diubah" });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan" });
    } finally {
      setIsLoading(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Profil" },
    { id: "password", label: "Ubah Password" },
    { id: "pin", label: "Ubah PIN" },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Kelola informasi akun dan keamanan</p>
      </div>

      {/* First-time Setup Alert */}
      {mustChangePassword && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold">Pengaturan Awal Diperlukan</p>
              <p className="text-sm mt-1">
                Untuk keamanan akun, silakan ubah password default Anda sebelum
                melanjutkan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {session?.user?.name}
              </h2>
              <p className="text-white/80">{session?.user?.identifier}</p>
              <p className="text-white/60 text-sm mt-1">
                {session?.user?.prodi} • Angkatan {session?.user?.angkatan}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setResult(null);
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="max-w-lg">
        <CardContent className="py-6">
          {/* Result Message */}
          {result && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                result.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {result.message}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  NIM
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {session?.user?.identifier}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nama
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {session?.user?.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Program Studi
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {session?.user?.prodi}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Angkatan
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {session?.user?.angkatan}
                </p>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Only show current password field if not first-time setup */}
              {!mustChangePassword && (
                <Input
                  label="Password Saat Ini"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              )}
              <Input
                label="Password Baru"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                {mustChangePassword ? "Simpan Password Baru" : "Ubah Password"}
              </Button>
            </form>
          )}

          {activeTab === "pin" && (
            <form onSubmit={handlePinChange} className="space-y-4">
              <Input
                label="PIN Saat Ini"
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                maxLength={6}
                required
              />
              <Input
                label="PIN Baru (6 digit)"
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={6}
                required
              />
              <Input
                label="Konfirmasi PIN Baru"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={6}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                Ubah PIN
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
