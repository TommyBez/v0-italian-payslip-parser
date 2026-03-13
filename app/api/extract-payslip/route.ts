import { generateText, Output } from "ai"
import { payslipDataSchema } from "@/lib/payslip-types"

export const maxDuration = 60

const EXTRACTION_PROMPT = `You are an expert in Italian payroll systems and payslip (busta paga) analysis. 
Extract all available information from this Italian payslip document accurately.

Key Italian payslip terms to look for:
- RETRIBUZIONE LORDA / LORDO = Gross salary
- NETTO IN BUSTA / NETTO = Net pay
- CONTRIBUTI INPS = Social security contributions
- IRPEF = Income tax
- ADDIZIONALE REGIONALE = Regional tax surcharge
- ADDIZIONALE COMUNALE = Municipal tax surcharge
- TFR = Severance pay accrual
- FERIE = Vacation days
- PERMESSI / ROL = Leave hours
- STRAORDINARI = Overtime
- INDENNITÀ = Allowances
- CODICE FISCALE = Tax code
- PARTITA IVA = VAT number
- CCNL = National collective labor agreement
- MATRICOLA = Employee ID

Important instructions:
1. Extract all monetary values in EUR
2. For the codice fiscale, ensure it follows the Italian format (16 characters)
3. For dates, use DD/MM/YYYY format
4. If a field is not visible or unclear, return null for that field
5. Calculate confidence based on how clearly the document is readable
6. Mask sensitive data like full IBAN (show only last 4 digits)
7. Note any anomalies or issues in the 'note' field

Analyze the document thoroughly and return the structured data.`

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { success: false, error: "Invalid file type. Please upload an image or PDF." },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const { output } = await generateText({
      model: "mistral/mistral-large-3",
      output: Output.object({
        schema: payslipDataSchema,
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
            file.type === "application/pdf"
              ? {
                  type: "file",
                  data: base64,
                  mediaType: "application/pdf",
                  filename: file.name,
                }
              : {
                  type: "image",
                  image: `data:${file.type};base64,${base64}`,
                },
          ],
        },
      ],
    })

    return Response.json({
      success: true,
      data: output,
    })
  } catch (error) {
    console.error("Extraction error:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract payslip data",
      },
      { status: 500 }
    )
  }
}
