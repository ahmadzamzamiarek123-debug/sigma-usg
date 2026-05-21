'use client'

import { useEffect, useCallback, useSyncExternalStore } from 'react'

let currentTheme: 'light' | 'dark' = 'light'
if (typeof window !== 'undefined') {
  currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(l => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return currentTheme
}

function getServerSnapshot() {
  return 'light' as const
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    // Initialization only runs once to capture default/stored theme
    const stored = localStorage.getItem('theme')
    let resolvedTheme: 'light' | 'dark' = 'light'
    if (stored === 'dark' || stored === 'light') {
      resolvedTheme = stored
    } else {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    if (resolvedTheme !== currentTheme) {
      currentTheme = resolvedTheme
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
      notifyListeners()
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    currentTheme = newTheme
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    notifyListeners()
  }, [])

  return { theme, toggleTheme }
}
