"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")

  // useTheme hook from next-themes
  const { setTheme: setNextTheme, theme: nextTheme } = useTheme()

  // Update state when component mounts
  useEffect(() => {
    setMounted(true)
    setTheme(nextTheme as "light" | "dark" | "system")
  }, [nextTheme])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
     
      onClick={() => {
        const newTheme = theme === "dark" ? "light" : "dark"
        setTheme(newTheme)
        setNextTheme(newTheme)
      }}
      className="rounded-full   p-2 h-7"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    Tema
    </Button>
  )
}

// Import useTheme from next-themes
import { useTheme } from "next-themes"

