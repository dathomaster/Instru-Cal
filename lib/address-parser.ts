/**
 * Simple utility to parse a full address string into components
 */
export function parseAddressString(addressString: string): {
  street: string
  city: string
  state: string
  zipCode: string
} {
  // Default empty result
  const result = {
    street: "",
    city: "",
    state: "",
    zipCode: "",
  }

  if (!addressString) return result

  try {
    // Try to match common US address formats
    // Example: "123 Main St, New York, NY 10001" or "123 Main St, New York NY 10001"
    const regex = /^(.*?),\s*(.*?),?\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i
    const match = addressString.match(regex)

    if (match) {
      result.street = match[1].trim()
      result.city = match[2].trim()
      result.state = match[3].toUpperCase()
      result.zipCode = match[4]
    } else {
      // If no match, try to extract just the street
      const parts = addressString.split(",")
      if (parts.length > 0) {
        result.street = parts[0].trim()
      }
    }

    return result
  } catch (error) {
    console.error("Error parsing address:", error)
    return result
  }
}
