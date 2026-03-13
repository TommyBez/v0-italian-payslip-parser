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
