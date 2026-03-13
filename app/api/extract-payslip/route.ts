import { generateText, Output } from "ai"
import { payslipDataSchema } from "@/lib/payslip-types"
import { parsePayslipNumbers } from "@/lib/decimal-parser"

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

CRITICAL - Decimal Separator Handling:
Italian payslips often use a VERTICAL LINE (|) as the decimal separator, for example:
- "1.234|56" means 1234.56 EUR
- "100|00" means 100.00 EUR
- "15|50" means 15.50 EUR

When you see a vertical line in numerical values, PRESERVE IT EXACTLY AS IS in the output.
The parsing layer will convert it to standard decimal format. Examples of correct output:
- importo: "1.234|56" → will become 1234.56
- aliquota: "8|47" → will become 8.47
- totale: "250|00" → will become 250.00

Important instructions:
1. Extract all monetary values in EUR, preserving vertical line separators if present
2. For numbers with vertical lines, keep the format exactly as found (e.g., "2.500|80")
3. For other numbers without vertical lines, use standard formats (dots for thousands, commas for decimals, or just dots)
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

    // Parse all numeric values, handling vertical line decimal separators
    const parsedData = parsePayslipNumbers(output)

    return Response.json({
      success: true,
      data: parsedData,
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
