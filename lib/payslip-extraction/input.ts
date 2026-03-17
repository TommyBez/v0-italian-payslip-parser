import {
  INVALID_PAYSLIP_FILE_MESSAGE,
  SUPPORTED_PAYSLIP_MIME_TYPES,
} from "@/lib/payslip-extraction/config"

export class PayslipInputError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "PayslipInputError"
    this.status = status
  }
}

export function isSupportedPayslipMimeType(
  mimeType: string
): mimeType is (typeof SUPPORTED_PAYSLIP_MIME_TYPES)[number] {
  return SUPPORTED_PAYSLIP_MIME_TYPES.includes(
    mimeType as (typeof SUPPORTED_PAYSLIP_MIME_TYPES)[number]
  )
}

export function getUploadedPayslipFile(entry: FormDataEntryValue | null): File {
  if (!(entry instanceof File)) {
    throw new PayslipInputError("No file provided")
  }

  return validatePayslipFile(entry)
}

export function validatePayslipFile(file: File): File {
  if (!isSupportedPayslipMimeType(file.type)) {
    throw new PayslipInputError(INVALID_PAYSLIP_FILE_MESSAGE)
  }

  return file
}
