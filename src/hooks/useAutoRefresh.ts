import { useEffect, useRef, useState } from 'react'

interface UseAutoRefreshOptions {
  interval?: number // in milliseconds
  enabled?: boolean
  onRefresh: () => void | Promise<void>
}

export const useAutoRefresh = ({ 
  interval = 60000, // Default 1 minute
  enabled = true, 
  onRefresh 
}: UseAutoRefreshOptions) => {
  const [isActive, setIsActive] = useState(enabled)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(async () => {
      if (isActive) {
        await onRefresh()
        setLastRefresh(new Date())
      }
    }, interval)
  }

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const toggle = () => {
    setIsActive(!isActive)
  }

  const manualRefresh = async () => {
    await onRefresh()
    setLastRefresh(new Date())
  }

  useEffect(() => {
    if (isActive && enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return () => stopAutoRefresh()
  }, [isActive, enabled, interval])

  useEffect(() => {
    // Page visibility change handling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRefresh()
      } else if (isActive && enabled) {
        startAutoRefresh()
        // Refresh immediately when page becomes visible again
        manualRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isActive, enabled])

  return {
    isActive,
    lastRefresh,
    toggle,
    manualRefresh,
    start: () => setIsActive(true),
    stop: () => setIsActive(false)
  }
}