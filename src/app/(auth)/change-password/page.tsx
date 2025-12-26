"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize theme
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    } else if (!stored) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate password
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password tidak sama");
      return;
    }

    // Validate PIN (for non-admin)
    if (session?.user?.role !== "ADMIN") {
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        setError("PIN harus 6 digit angka");
        return;
      }

      if (pin !== confirmPin) {
        setError("PIN tidak sama");
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          pin: session?.user?.role !== "ADMIN" ? pin : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update session to reflect mustChangePassword = false
        await update();

        // Redirect based on role
        const role = session?.user?.role;
        if (role === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (role === "OPERATOR") {
          router.push("/operator/dashboard");
        } else {
          router.push("/user/dashboard");
        }
        router.refresh();
      } else {
        setError(data.error || "Terjadi kesalahan");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-usg.png"
              alt="USG Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Ubah Password & PIN
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Untuk keamanan, silakan ubah password default Anda
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <div className="card-body">
            {error && (
              <div className="mb-4 p-3 text-sm text-center rounded-md bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="input-label">
                  Password Baru
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="input"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="input-label">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="input"
                  required
                />
              </div>

              {/* PIN (for non-admin) */}
              {session?.user?.role !== "ADMIN" && (
                <>
                  <hr className="border-[var(--border-primary)] my-4" />

                  <div>
                    <label htmlFor="pin" className="input-label">
                      PIN Transaksi (6 digit)
                    </label>
                    <input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={(e) =>
                        setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Contoh: 123456"
                      className="input"
                      required
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPin" className="input-label">
                      Konfirmasi PIN
                    </label>
                    <input
                      id="confirmPin"
                      type="password"
                      value={confirmPin}
                      onChange={(e) =>
                        setConfirmPin(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      placeholder="Ulangi PIN"
                      className="input"
                      required
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan & Lanjutkan"
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          © {new Date().getFullYear()} Universitas Sunan Gresik
        </p>
      </div>
    </div>
  );
}
