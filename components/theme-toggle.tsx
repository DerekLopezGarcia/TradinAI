"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslation } from "@/lib/i18n/useTranslation"

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-muted/20 transition-colors">
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg hover:bg-muted/20 transition-all duration-200 hover:scale-110"
      title={theme === "dark" ? t('themeToggle.light') : t('themeToggle.dark')}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  )
}

