// resources/js/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check if dark mode is already enabled
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  function toggleTheme() {
    document.documentElement.classList.toggle("dark")
    setIsDarkMode(!isDarkMode)
    
    // Save preference to localStorage
    if (isDarkMode) {
      localStorage.setItem("vite-ui-theme", "light")
    } else {
      localStorage.setItem("vite-ui-theme", "dark")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(className)}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle tema</span>
    </Button>
  )
}