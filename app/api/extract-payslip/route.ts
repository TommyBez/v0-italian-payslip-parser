import { generateText, Output } from "ai"
import { payslipDataSchema, ModelResult } from "@/lib/payslip-types"

export const maxDuration = 120

const MODELS = [
  { id: "mistral/mistral-large-3", label: "Mistral Large 3" },
  { id: "google/gemini-3-flash", label: "Gemini 3 Flash" },
  { id: "mistral/pixtral-large", label: "Pixtral Large" },
] as const

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

CRITICAL - Visual Decimal Separator in Italian Payslips:
Many Italian payslips use a GRAPHICAL VERTICAL LINE in tables to visually separate the integer part from the decimal part of numbers.
This vertical line is NOT a text character, but a TABLE BORDER or visual divider.

When you see numbers in table cells where:
- A vertical border/line separates digits (e.g., a cell shows "1234" then a line then "56")
- This means the value is 1234.56 (the line indicates the decimal point)

Examples of how to interpret:
- "1234 | 56" visually in a table = 1234.56 EUR
- "100 | 00" visually = 100.00 EUR  
- "2500 | 80" visually = 2500.80 EUR

Always output numeric values as standard decimal numbers (e.g., 1234.56, not "1234|56").

Important instructions:
1. Extract all monetary values in EUR as standard decimal numbers
2. Interpret vertical graphical lines in tables as decimal separators
3. Use standard decimal format in your output (e.g., 1234.56)
4. For the codice fiscale, ensure it follows the Italian format (16 characters)
5. For dates, use DD/MM/YYYY format
6. If a field is not visible or unclear, return null for that field
7. Calculate confidence based on how clearly the document is readable
8. Mask sensitive data like full IBAN (show only last 4 digits)
9. Note any anomalies or issues in the 'note' field

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

    // Prepare the message content for both models
    const messageContent = [
      {
        type: "text" as const,
        text: EXTRACTION_PROMPT,
      },
      file.type === "application/pdf"
        ? {
            type: "file" as const,
            data: base64,
            mediaType: "application/pdf" as const,
            filename: file.name,
          }
        : {
            type: "image" as const,
            image: `data:${file.type};base64,${base64}`,
          },
    ]

    // Run both models in parallel
    const extractionPromises = MODELS.map(async (model): Promise<ModelResult> => {
      const startTime = Date.now()
      try {
        const { output } = await generateText({
          model: model.id,
          output: Output.object({
            schema: payslipDataSchema,
          }),
          messages: [
            {
              role: "user",
              content: messageContent,
            },
          ],
        })

        return {
          model: model.id,
          modelLabel: model.label,
          success: true,
          data: output,
          processingTime: Date.now() - startTime,
        }
      } catch (error) {
        return {
          model: model.id,
          modelLabel: model.label,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : "Extraction failed",
          processingTime: Date.now() - startTime,
        }
      }
    })

    const results = await Promise.all(extractionPromises)

    return Response.json({
      success: results.some((r) => r.success),
      results,
    })
  } catch (error) {
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
