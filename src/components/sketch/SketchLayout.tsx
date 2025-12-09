'use client'

import { useState } from 'react'
import { SketchSidebar } from './SketchSidebar'

interface SketchLayoutProps {
  children: React.ReactNode
}

export function SketchLayout({ children }: SketchLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen sketch-page" style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}>
      {/* Sidebar */}
      <SketchSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-30 sketch-header md:hidden flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="sketch-btn py-2 px-3"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="font-bold" style={{ fontFamily: "'Comic Neue', cursive" }}>
          ✏️ Fintech Kampus
        </span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="sketch-content md:pl-64 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
