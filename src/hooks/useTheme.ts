import { useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'hom-theme-preference'
const SYSTEM_PREFERENCE = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored || SYSTEM_PREFERENCE
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Sync theme with DOM + localStorage on mount/change
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch { /* storage unavailable */ }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}