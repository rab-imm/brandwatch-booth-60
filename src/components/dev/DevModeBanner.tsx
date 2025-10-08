import { useState, useEffect } from "react"
import { ExclamationTriangleIcon, Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"

// Only render in development
if (!import.meta.env.DEV) {
  throw new Error("DevModeBanner should only be imported in development!")
}

export const DevModeBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

  // Load visibility state from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('devBannerDismissed')
    if (saved === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem('devBannerDismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span className="font-bold text-sm">
            🔧 DEVELOPMENT MODE ACTIVE
          </span>
          <span className="text-xs opacity-90 hidden sm:inline">
            - User switcher enabled for testing
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-white/20 text-white"
        >
          <Cross2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
