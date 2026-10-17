import { useEffect } from 'react'

type Theme = 'light'

/**
 * The storefront is light only (champagne and teal). Dark mode comes after launch.
 * The interface is kept so callers compile; stored preferences are ignored.
 */
export function useTheme() {
  useEffect(() => {
    document.body.setAttribute('data-theme', 'light')
  }, [])

  const theme: Theme = 'light'
  const toggleTheme = () => {}

  return { theme, toggleTheme }
}
