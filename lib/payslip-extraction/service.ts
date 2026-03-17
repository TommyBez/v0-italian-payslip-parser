import "server-only"

import { responseFormatFromZodObject } from "@mistralai/mistralai/extra/structChat.js"
import {
  MISTRAL_OCR_MODEL,
  MISTRAL_PIPELINE_LABEL,
  MISTRAL_PIPELINE_MODEL_ID,
} from "@/lib/payslip-extraction/config"
import { validatePayslipFile } from "@/lib/payslip-extraction/input"
import { getMistralClient } from "@/lib/payslip-extraction/mistral-client"
import { PAYSLIP_EXTRACTION_SYSTEM_PROMPT } from "@/lib/payslip-extraction/prompt"
import { ExtractionResult, ModelResult, payslipDataSchema } from "@/lib/payslip-types"

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

function parsePayslipData(rawContent: string) {
  return payslipDataSchema.parse(JSON.parse(rawContent))
}

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer()
  return Buffer.from(bytes).toString("base64")
}

async function buildOcrDocumentPayload(file: File) {
  const base64 = await fileToBase64(file)
  const dataUrl = `data:${file.type};base64,${base64}`

  if (file.type === "application/pdf") {
    return {
      type: "document_url" as const,
      documentUrl: dataUrl,
      documentName: file.name,
    }
  }

  return {
    type: "image_url" as const,
    imageUrl: dataUrl,
  }
}

export async function extractPayslipFromFile(file: File): Promise<ExtractionResult> {
  const validFile = validatePayslipFile(file)
  const client = getMistralClient()
  const startTime = Date.now()

  try {
    const document = await buildOcrDocumentPayload(validFile)

    const ocrResponse = await client.ocr.process({
      model: MISTRAL_OCR_MODEL,
      document,
      extractHeader: true,
      extractFooter: true,
      tableFormat: "markdown",
      documentAnnotationFormat: responseFormatFromZodObject(payslipDataSchema),
      documentAnnotationPrompt: PAYSLIP_EXTRACTION_SYSTEM_PROMPT,
    })

    if (!ocrResponse.documentAnnotation) {
      throw new Error("Mistral OCR did not return any document annotation")
    }

    console.log("ocrResponse.documentAnnotation", ocrResponse.documentAnnotation)

    const parsedData = parsePayslipData(ocrResponse.documentAnnotation)

    const result: ModelResult = {
      model: MISTRAL_PIPELINE_MODEL_ID,
      modelLabel: MISTRAL_PIPELINE_LABEL,
      success: true,
      data: parsedData,
      processingTime: Date.now() - startTime,
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
  }
}
