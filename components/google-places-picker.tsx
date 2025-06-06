"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, MapPin } from "lucide-react"

interface AddressDetails {
  fullAddress: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface GooglePlacesPickerProps {
  apiKey: string
  onAddressSelect?: (address: AddressDetails) => void
  placeholder?: string
  className?: string
  error?: string
}

// Declare the Google Extended Components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gmpx-api-loader": {
        key: string
        "solution-channel": string
      }
      "gmpx-place-picker": {
        placeholder?: string
        ref?: React.RefObject<any>
      }
    }
  }
}

export function GooglePlacesPicker({
  apiKey,
  onAddressSelect,
  placeholder = "Enter an address",
  className = "",
  error,
}: GooglePlacesPickerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const placePickerRef = useRef<any>(null)

  useEffect(() => {
    // Load the Google Maps Extended Component Library
    const script = document.createElement("script")
    script.type = "module"
    script.src = "https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"

    script.onload = () => {
      setIsLoaded(true)
    }

    script.onerror = () => {
      setLoadError("Failed to load Google Maps components")
    }

    // Only add script if it doesn't already exist
    if (!document.querySelector('script[src*="extended-component-library"]')) {
      document.head.appendChild(script)
    } else {
      setIsLoaded(true)
    }

    return () => {
      // Cleanup if needed
    }
  }, [])

  useEffect(() => {
    if (isLoaded && placePickerRef.current) {
      const placePicker = placePickerRef.current

      // Listen for place selection
      const handlePlaceChange = (event: any) => {
        const place = event.target.value

        if (place && onAddressSelect) {
          // Parse the place object to extract address components
          const addressDetails = parseGooglePlace(place)
          onAddressSelect(addressDetails)
        }
      }

      placePicker.addEventListener("gmpx-placechange", handlePlaceChange)

      return () => {
        placePicker.removeEventListener("gmpx-placechange", handlePlaceChange)
      }
    }
  }, [isLoaded, onAddressSelect])

  const parseGooglePlace = (place: any): AddressDetails => {
    let street = ""
    let city = ""
    let state = ""
    let zipCode = ""
    let country = ""

    // Extract address components from the place object
    if (place.addressComponents) {
      for (const component of place.addressComponents) {
        const types = component.types

        if (types.includes("street_number")) {
          street = component.longText + " "
        } else if (types.includes("route")) {
          street += component.longText
        } else if (types.includes("locality")) {
          city = component.longText
        } else if (types.includes("administrative_area_level_1")) {
          state = component.shortText
        } else if (types.includes("postal_code")) {
          zipCode = component.longText
        } else if (types.includes("country")) {
          country = component.longText
        }
      }
    }

    return {
      fullAddress: place.formattedAddress || "",
      street: street.trim(),
      city,
      state,
      zipCode,
      country,
    }
  }

  if (loadError) {
    return (
      <div className={className}>
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Enter address manually (Google Maps unavailable)"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          />
        </div>
        <p className="text-amber-600 text-sm mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Address search unavailable. Please enter address manually below.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Google Maps API Loader */}
      <gmpx-api-loader key={apiKey} solution-channel="GMP_GE_placepicker_v2" />

      {/* Place Picker Component */}
      <div className="relative">
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 text-gray-400 h-4 w-4 z-10" />
          {isLoaded ? (
            <gmpx-place-picker
              ref={placePickerRef}
              placeholder={placeholder}
              style={{
                width: "100%",
                paddingLeft: "2.5rem",
                paddingRight: "0.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                border: error ? "1px solid #ef4444" : "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
              }}
            />
          ) : (
            <input
              type="text"
              placeholder="Loading address search..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-1">
          {isLoaded
            ? "Type to search for an address or fill in the fields manually below"
            : "Loading address search..."}
        </p>
      </div>
    </div>
  )
}
