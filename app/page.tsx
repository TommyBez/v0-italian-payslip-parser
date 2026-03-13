"use client"

import { useState, useCallback } from "react"
import { UploadZone } from "@/components/payslip/upload-zone"
import { PayslipResults } from "@/components/payslip/payslip-results"
import { PrivacyNotice } from "@/components/payslip/privacy-notice"
import { ErrorDisplay } from "@/components/payslip/error-display"
import { FeatureCards } from "@/components/payslip/feature-cards"
import { Button } from "@/components/ui/button"
import { FileDown, RefreshCw, FileText } from "lucide-react"
import type { PayslipData, ExtractionResult } from "@/lib/payslip-types"

type AppState = "idle" | "processing" | "success" | "error"

export default function PayslipExtractor() {
  const [state, setState] = useState<AppState>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<PayslipData | null>(null)
  const [error, setError] = useState<string>("")

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    setState("processing")
    setError("")
    setExtractedData(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract-payslip", {
        method: "POST",
        body: formData,
      })

      const result: ExtractionResult = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Errore durante l'estrazione dei dati")
      }

      if (result.data) {
        setExtractedData(result.data)
        setState("success")
      } else {
        throw new Error("Nessun dato estratto dal documento")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si e verificato un errore imprevisto")
      setState("error")
    }
  }, [])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setExtractedData(null)
    setError("")
    setState("idle")
  }, [])

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }, [selectedFile, handleFileSelect])

  const handleExportJSON = useCallback(() => {
    if (!extractedData) return

    const dataStr = JSON.stringify(extractedData, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `busta-paga-${extractedData.periodo.mese}-${extractedData.periodo.anno}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [extractedData])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold md:text-xl">Estrattore Busta Paga</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Estrazione automatica dati da cedolini italiani
              </p>
            </div>
          </div>
          {state === "success" && (
            <Button onClick={handleExportJSON} variant="outline" size="sm" className="gap-2">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Esporta JSON</span>
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Hero Section - only show when idle */}
        {state === "idle" && (
          <section className="mb-10 text-center">
            <h2 className="text-balance text-2xl font-bold tracking-tight md:text-4xl">
              Estrai i Dati dalla Tua Busta Paga
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground md:text-lg">
              Carica un&apos;immagine o un PDF della tua busta paga italiana e ottieni
              tutti i dati strutturati in pochi secondi grazie all&apos;intelligenza artificiale.
            </p>
          </section>
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Upload Zone */}
          <UploadZone
            onFileSelect={handleFileSelect}
            isProcessing={state === "processing"}
            selectedFile={selectedFile}
            onClear={handleClear}
          />

          {/* Error Display */}
          {state === "error" && (
            <ErrorDisplay message={error} onRetry={handleRetry} />
          )}

          {/* Results */}
          {state === "success" && extractedData && (
            <div className="space-y-6">
              <PayslipResults data={extractedData} />
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={handleClear} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Nuova Estrazione
                </Button>
                <Button onClick={handleExportJSON} className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Scarica JSON
                </Button>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <PrivacyNotice />

          {/* Feature Cards - only show when idle or error */}
          {(state === "idle" || state === "error") && (
            <section className="pt-4">
              <h3 className="mb-4 text-center text-lg font-semibold">
                Perche Usare il Nostro Estrattore?
              </h3>
              <FeatureCards />
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by <strong>Mistral AI</strong> via Vercel AI Gateway
          </p>
          <p className="mt-1">
            I tuoi dati non vengono mai salvati. Elaborazione conforme al GDPR.
          </p>
        </div>
      </footer>
    </main>
  )
}
