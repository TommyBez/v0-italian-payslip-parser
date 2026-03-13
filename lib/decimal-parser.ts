/**
 * Italian Payslip Decimal Parser
 * Handles vertical line (|) as decimal separator
 * Examples: "1.234|56" → 1234.56, "100|00" → 100.00
 */

/**
 * Parse Italian formatted numbers with vertical line as decimal separator
 * @param value - Raw string value that may contain vertical line separator
 * @returns Normalized number value
 */
export function parseItalianDecimal(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return value

  const str = String(value).trim()
  if (!str) return null

  try {
    // Handle vertical line as decimal separator (e.g., "1.234|56" → 1234.56)
    if (str.includes("|")) {
      const [integerPart, decimalPart] = str.split("|")
      
      // Remove dots from integer part (thousand separators)
      const cleanInteger = integerPart.replace(/\./g, "")
      
      // Combine and convert to number
      const combined = parseFloat(`${cleanInteger}.${decimalPart}`)
      return isNaN(combined) ? null : combined
    }

    // Handle standard formats:
    // 1. European format with dot as thousand separator and comma as decimal: "1.234,56"
    if (str.includes(".") && str.includes(",")) {
      // Remove dots (thousand separators) and replace comma with dot
      return parseFloat(str.replace(/\./g, "").replace(",", "."))
    }

    // 2. Only comma as decimal separator: "1234,56"
    if (str.includes(",")) {
      return parseFloat(str.replace(",", "."))
    }

    // 3. Standard format: "1234.56" or "1234"
    return parseFloat(str)
  } catch {
    return null
  }
}

/**
 * Format number for display with Italian conventions
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "1.234,56"
 */
export function formatItalianNumber(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return "-"

  const formatted = new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

  return formatted
}

/**
 * Recursively parse all numeric values in a payslip object
 * @param obj - Object potentially containing numeric strings
 * @returns Object with parsed numeric values
 */
export function parsePayslipNumbers<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== "object") return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => parsePayslipNumbers(item)) as T
  }

  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Fields that should be treated as numbers
    const numericFields = [
      "importo",
      "aliquota",
      "retribuzioneLorda",
      "totale",
      "imponibile",
      "imposta",
      "detrazioni",
      "netto",
      "regionale",
      "comunale",
      "accantonamento",
      "maturate",
      "godute",
      "residue",
      "maturati",
      "goduti",
      "residui",
      "nettoInBusta",
      "giorniLavorati",
      "oreLavorate",
      "confidenza",
    ]

    if (numericFields.includes(key) && typeof value === "string") {
      result[key] = parseItalianDecimal(value)
    } else if (typeof value === "object") {
      result[key] = parsePayslipNumbers(value)
    } else {
      result[key] = value
    }
  }

  return result as T
}
