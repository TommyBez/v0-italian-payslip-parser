export const SUPPORTED_PAYSLIP_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const

export const SUPPORTED_PAYSLIP_ACCEPT = SUPPORTED_PAYSLIP_MIME_TYPES.join(",")

export const SUPPORTED_PAYSLIP_FORMATS_LABEL = "JPG, PNG, WebP, GIF, PDF"

export const INVALID_PAYSLIP_FILE_MESSAGE =
  "Invalid file type. Please upload an image or PDF."

export const INVALID_PAYSLIP_FILE_ALERT =
  "Per favore carica un'immagine (JPG, PNG, WebP, GIF) o un PDF"

export const MISTRAL_OCR_MODEL = "mistral-ocr-latest"

export const MISTRAL_PIPELINE_MODEL_ID = "mistral-ocr-pipeline"
export const MISTRAL_PIPELINE_LABEL = "Mistral OCR Pipeline"
