import { generateText, Output } from "ai"
import { Mistral } from "@mistralai/mistralai"
import { payslipDataSchema, ModelResult, TokenUsage, CostBreakdown } from "@/lib/payslip-types"

export const maxDuration = 120

// Model pricing per million tokens (USD)
// Prices as of March 2026
const MODEL_PRICING: Record<string, { input: number; output: number; perPage?: number }> = {
  "mistral-ocr-latest": { input: 0, output: 0, perPage: 0.10 }, // $0.10 per page for OCR
  "google/gemini-3-flash": { input: 0.50, output: 3.00 },
  "google/gemini-3.1-flash-lite-preview": { input: 0.25, output: 1.50 },
}

// AI SDK models (use Vercel AI Gateway)
const AI_SDK_MODELS = [
  { id: "google/gemini-3-flash", label: "Gemini 3 Flash" },
  { id: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite" },
] as const

// Mistral OCR model (uses Mistral SDK directly)
const MISTRAL_OCR_MODEL = { id: "mistral-ocr-latest", label: "Mistral OCR" }

function calculateCost(modelId: string, usage: TokenUsage, pagesProcessed?: number): CostBreakdown {
  const pricing = MODEL_PRICING[modelId] || { input: 0, output: 0 }
  
  // For OCR models, cost is per page
  if (pricing.perPage && pagesProcessed) {
    const totalCost = pagesProcessed * pricing.perPage
    return {
      inputCost: totalCost,
      outputCost: 0,
      totalCost,
      currency: "USD",
    }
  }
  
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: "USD",
  }
}

// Mistral OCR extraction function
async function extractWithMistralOCR(
  base64: string,
  isPdf: boolean,
  mimeType: string
): Promise<ModelResult> {
  const startTime = Date.now()
  
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    return {
      model: MISTRAL_OCR_MODEL.id,
      modelLabel: MISTRAL_OCR_MODEL.label,
      success: false,
      data: null,
      error: "MISTRAL_API_KEY non configurata",
      processingTime: Date.now() - startTime,
    }
  }

  try {
    const client = new Mistral({ apiKey })
    
    // Create data URL for OCR
    const dataUrl = `data:${mimeType};base64,${base64}`
    
    console.log("[v0] Mistral OCR - Processing, isPdf:", isPdf, "mimeType:", mimeType)
    
    // OCR the document directly with base64 data URL
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: isPdf
        ? { type: "document_url", documentUrl: dataUrl }
        : { type: "image_url", imageUrl: dataUrl },
      includeImageBase64: true,
    })
    
    console.log("[v0] Mistral OCR - OCR completed, pages:", ocrResponse.pages?.length)

    // Combine all pages markdown
    const fullMarkdown = ocrResponse.pages
      .map((page) => page.markdown)
      .join("\n\n---\n\n")

    const pagesProcessed = ocrResponse.pages.length

    // Now use Mistral chat to extract structured data from the OCR text
    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest",
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert in Italian payroll systems. Extract structured data from the following OCR text of an Italian payslip (busta paga).
          
${EXTRACTION_PROMPT}

Return the data as a valid JSON object matching this schema:
- periodo: { mese: string, anno: number }
- dipendente: { nome, cognome, codiceFiscale, dataNascita, indirizzo, matricola, dataAssunzione, livello, qualifica, ccnl }
- azienda: { ragioneSociale, partitaIva, codiceFiscale, indirizzo, inps, inail }
- retribuzione: { stipendioBase, contingenza, scattiAnzianita, superminimo, totaleCompetenze, vociRetributive[] }
- detrazioni: { contributiInps, irpefLorda, detrazioniLavoro, detrazioniFamiliari, addizionaleRegionale, addizionaleComunale, altreDetrazioni, totaleRitenute, deduzioni[] }
- netto: { importo, modalitaPagamento, iban }
- tfr: { quotaMensile, totaleAccantonato }
- fpiPermessi: { ferieMaturate, ferieGodute, ferieResiduo, permessiMaturati, permessiGoduti, permessiResiduo, rolMaturato, rolGoduto, rolResiduo }
- oreLavoro: { ordinarie, straordinario, notturne, festive, malattia, ferie, permessi }
- note: string | null
- confidenza: number (0-100)`,
        },
        {
          role: "user",
          content: `Ecco il testo OCR della busta paga:\n\n${fullMarkdown}`,
        },
      ],
    })

    const content = chatResponse.choices?.[0]?.message?.content
    if (!content || typeof content !== "string") {
      throw new Error("No response from Mistral chat")
    }

    const extractedData = JSON.parse(content)
    const validatedData = payslipDataSchema.parse(extractedData)

    // Calculate usage from chat response
    const tokenUsage: TokenUsage = {
      inputTokens: chatResponse.usage?.promptTokens || 0,
      outputTokens: chatResponse.usage?.completionTokens || 0,
      totalTokens: chatResponse.usage?.totalTokens || 0,
    }

    const cost = calculateCost(MISTRAL_OCR_MODEL.id, tokenUsage, pagesProcessed)

    return {
      model: MISTRAL_OCR_MODEL.id,
      modelLabel: MISTRAL_OCR_MODEL.label,
      success: true,
      data: validatedData,
      processingTime: Date.now() - startTime,
      usage: {
        ...tokenUsage,
        // Add pages info to usage for display
        inputTokens: pagesProcessed, // Repurpose for pages count in OCR
      },
      cost,
    }
  } catch (error) {
    console.log("[v0] Mistral OCR - ERROR:", error instanceof Error ? error.message : String(error))
    if (error && typeof error === "object" && "statusCode" in error) {
      console.log("[v0] Mistral OCR - Status code:", (error as { statusCode: number }).statusCode)
    }
    if (error && typeof error === "object" && "body" in error) {
      console.log("[v0] Mistral OCR - Body:", (error as { body: string }).body)
    }
    
    return {
      model: MISTRAL_OCR_MODEL.id,
      modelLabel: MISTRAL_OCR_MODEL.label,
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "OCR extraction failed",
      processingTime: Date.now() - startTime,
    }
  }
}

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
    const isPdf = file.type === "application/pdf"
    const dataUrl = `data:${file.type};base64,${base64}`

    // Run all models in parallel (AI SDK models + Mistral OCR)
    const aiSdkPromises = AI_SDK_MODELS.map(async (model): Promise<ModelResult> => {
      const startTime = Date.now()

      // Build message content based on file type
      const messageContent: Array<
        | { type: "text"; text: string }
        | { type: "image"; image: string }
        | { type: "file"; data: string; mediaType: "application/pdf"; filename: string }
      > = [
        {
          type: "text",
          text: EXTRACTION_PROMPT,
        },
      ]

      if (isPdf) {
        messageContent.push({
          type: "file",
          data: base64,
          mediaType: "application/pdf",
          filename: file.name,
        })
      } else {
        // For images, use base64 string directly (not data URL)
        messageContent.push({
          type: "image",
          image: base64,
        })
      }

      try {
        const { output, usage } = await generateText({
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

        const tokenUsage: TokenUsage = {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
          totalTokens: usage.totalTokens || 0,
          cachedInputTokens: usage.inputTokenDetails?.cacheReadTokens,
        }

        const cost = calculateCost(model.id, tokenUsage)

        return {
          model: model.id,
          modelLabel: model.label,
          success: true,
          data: output,
          processingTime: Date.now() - startTime,
          usage: tokenUsage,
          cost,
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

    // Add Mistral OCR extraction
    const mistralOcrPromise = extractWithMistralOCR(base64, isPdf, file.type)

    // Wait for all extractions
    const [mistralOcrResult, ...aiSdkResults] = await Promise.all([
      mistralOcrPromise,
      ...aiSdkPromises,
    ])

    const results = [mistralOcrResult, ...aiSdkResults]

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
