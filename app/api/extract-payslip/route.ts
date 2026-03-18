import {
  getUploadedPayslipFile,
  PayslipInputError,
} from "@/lib/payslip-extraction/input"
import { extractPayslipFromFile } from "@/lib/payslip-extraction/service"

export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = getUploadedPayslipFile(formData.get("file"))
    const result = await extractPayslipFromFile(file)

    return Response.json(result)
  } catch (error) {
    if (error instanceof PayslipInputError) {
      return Response.json(
        {
          success: false,
          error: error.message,
          results: [],
        },
        { status: error.status }
      )
    }

    console.error("Extraction error:", error)
    return Response.json(
      {
        success: false,
        results: [],
      },
      { status: 500 }
    )
  }
}
