"use client"

import { useState, useRef } from "react"

interface PlacesAutocompleteProps {
  apiKey: string
  onAddressSelect?: (address: AddressDetails) => void
}

export interface AddressDetails {
  fullAddress: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

// Declare Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              types?: string[]
              fields?: string[]
            },
          ) => {
            addListener: (event: string, callback: () => void) => void
            getPlace: () => {
              address_components?: Array<{
                long_name: string
                short_name: string
                types: string[]
              }>
              formatted_address?: string
            }
          }
        }
      }
    }
  }
}

export function usePlacesAutocomplete({ apiKey, onAddressSelect }: PlacesAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const autocompleteRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Initialize autocomplete when Google Maps API is loaded
  const initAutocomplete = (inputElement: HTMLInputElement) => {
    if (!window.google?.maps?.places) {
      setError(new Error("Google Maps Places API not loaded"))
      return
    }

    try {
      // Store the input reference
      inputRef.current = inputElement

      // Create the autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
        types: ["address"],
        fields: ["address_components", "formatted_address"],
      })

      // Store the autocomplete reference
      autocompleteRef.current = autocomplete

      // Add place_changed event listener
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) {
          console.warn("No address components found")
          return
        }

        // Parse address components
        const addressDetails = parseAddressComponents(place)

        // Call the callback with the address details
        if (onAddressSelect) {
          onAddressSelect(addressDetails)
        }
      })

      setIsLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to initialize Places Autocomplete"))
    }
  }

  // Parse address components from Google Places result
  const parseAddressComponents = (place: any): AddressDetails => {
    let street = ""
    let city = ""
    let state = ""
    let zipCode = ""
    let country = ""

    // Extract address components
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types

        if (types.includes("street_number")) {
          street = component.long_name + " "
        } else if (types.includes("route")) {
          street += component.long_name
        } else if (types.includes("locality")) {
          city = component.long_name
        } else if (types.includes("administrative_area_level_1")) {
          state = component.short_name
        } else if (types.includes("postal_code")) {
          zipCode = component.long_name
        } else if (types.includes("country")) {
          country = component.long_name
        }
      }
    }

    return {
      fullAddress: place.formatted_address || "",
      street: street.trim(),
      city,
      state,
      zipCode,
      country,
    }
  }

  // Handle script loading
  const handleScriptLoad = () => {
    setIsLoaded(true)
  }

  // Handle script error
  const handleScriptError = (err: Error) => {
    setError(err)
  }

  return {
    isLoaded,
    error,
    initAutocomplete,
    handleScriptLoad,
    handleScriptError,
  }
}
