"use client"

import { useEffect, useState } from "react"

interface GoogleMapsScriptProps {
  apiKey: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

// Declare the global callback function
declare global {
  interface Window {
    initGoogleMaps?: () => void
  }
}

export function GoogleMapsScript({ apiKey, onLoad, onError }: GoogleMapsScriptProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Skip if already loaded or no API key
    if (isLoaded || window.google?.maps?.places || !apiKey) {
      if (window.google?.maps?.places && onLoad) {
        onLoad()
      }
      return
    }

    // Skip if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true

    // Define the callback function
    window.initGoogleMaps = () => {
      setIsLoaded(true)
      if (onLoad) onLoad()
    }

    // Handle errors
    script.onerror = () => {
      const error = new Error("Failed to load Google Maps API")
      setError(error)
      if (onError) onError(error)
    }

    document.head.appendChild(script)

    return () => {
      // Clean up
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps
      }
    }
  }, [apiKey, isLoaded, onLoad, onError])

  return null
}
