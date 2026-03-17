import "server-only"

import { zodToJsonSchema } from "zod-to-json-schema"
import {
  MISTRAL_EXTRACTION_MODEL,
  MISTRAL_OCR_MODEL,
  MISTRAL_PIPELINE_LABEL,
  MISTRAL_PIPELINE_MODEL_ID,
} from "@/lib/payslip-extraction/config"
import { validatePayslipFile } from "@/lib/payslip-extraction/input"
import { getMistralClient } from "@/lib/payslip-extraction/mistral-client"
import {
  buildPayslipExtractionPrompt,
  PAYSLIP_EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/payslip-extraction/prompt"
import {
  ExtractionResult,
  ModelResult,
  payslipDataSchema,
  TokenUsage,
} from "@/lib/payslip-types"

const payslipJsonSchema = zodToJsonSchema(payslipDataSchema, {
  $refStrategy: "none",
})

function buildTokenUsage(usage?: {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}): TokenUsage | undefined {
  if (!usage) {
    return undefined
  }

  return {
    inputTokens: usage.promptTokens || 0,
    outputTokens: usage.completionTokens || 0,
    totalTokens: usage.totalTokens || 0,
  }
}

function extractMessageText(
  content: string | Array<{ type?: string; text?: string }> | null | undefined
) {
  if (typeof content === "string") {
    return content
  }

  if (!content) {
    return ""
  }

  return content
    .map((chunk) => {
      if (chunk.type === "text" && typeof chunk.text === "string") {
        return chunk.text
      }

      return ""
    })
    .join("")
}

function buildOcrMarkdownDocument(ocrResponse: {
  pages: Array<{
    index: number
    markdown: string
    header?: string | null
    footer?: string | null
  }>
}) {
  return ocrResponse.pages
    .map((page) => {
      const parts = [`## Page ${page.index + 1}`]

      if (page.header) {
        parts.push(`Header:\n${page.header}`)
      }

      parts.push(page.markdown)

      if (page.footer) {
        parts.push(`Footer:\n${page.footer}`)
      }

      return parts.join("\n\n")
    })
    .join("\n\n")
}

function buildFailedResult(error: unknown, processingTime: number): ModelResult {
  return {
    model: MISTRAL_PIPELINE_MODEL_ID,
    modelLabel: MISTRAL_PIPELINE_LABEL,
    success: false,
    data: null,
    error: error instanceof Error ? error.message : "Extraction failed",
    processingTime,
  }
}

export async function extractPayslipFromFile(file: File): Promise<ExtractionResult> {
  const validFile = validatePayslipFile(file)
  const client = getMistralClient()
  const startTime = Date.now()
  let uploadedFileId: string | null = null

  try {
    const uploadedFile = await client.files.upload({
      file: validFile,
      purpose: "ocr",
    })
    uploadedFileId = uploadedFile.id

    const ocrResponse = await client.ocr.process({
      model: MISTRAL_OCR_MODEL,
      document: {
        type: "file",
        fileId: uploadedFileId,
      },
      extractHeader: true,
      extractFooter: true,
    })

    console.log("ocrResponse", ocrResponse)
    const ocrMarkdown = buildOcrMarkdownDocument(ocrResponse)
    console.log("ocrMarkdown", ocrMarkdown)

    const chatResponse = await client.chat.complete({
      model: MISTRAL_EXTRACTION_MODEL,
      temperature: 0.5,
      maxTokens: 4000,
      messages: [
        {
          role: "system",
          content: PAYSLIP_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildPayslipExtractionPrompt(ocrMarkdown),
        },
      ],
      responseFormat: {
        type: "json_schema",
        jsonSchema: {
          name: "payslip_data",
          schemaDefinition: payslipJsonSchema,
          strict: true,
        },
      },
    })

    const rawContent = extractMessageText(chatResponse.choices[0]?.message.content)

    if (!rawContent) {
      throw new Error("Mistral did not return any structured output")
    }

    const parsedData = payslipDataSchema.parse(JSON.parse(rawContent))

    const result: ModelResult = {
      model: MISTRAL_PIPELINE_MODEL_ID,
      modelLabel: MISTRAL_PIPELINE_LABEL,
      success: true,
      data: parsedData,
      processingTime: Date.now() - startTime,
      usage: buildTokenUsage(chatResponse.usage),
    }

    return {
      success: true,
      results: [result],
    }
  } catch (error) {
    return {
      success: false,
      results: [buildFailedResult(error, Date.now() - startTime)],
    }
  } finally {
    if (uploadedFileId) {
      try {
        await client.files.delete({ fileId: uploadedFileId })
      } catch (cleanupError) {
        console.warn("Failed to delete uploaded Mistral file", cleanupError)
      }
    }
  }
}
