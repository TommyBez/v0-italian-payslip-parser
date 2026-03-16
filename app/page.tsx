"use client"

import { useState, useCallback } from "react"
import { UploadZone } from "@/components/payslip/upload-zone"
import { PayslipResults } from "@/components/payslip/payslip-results"
import { PrivacyNotice } from "@/components/payslip/privacy-notice"
import { ErrorDisplay } from "@/components/payslip/error-display"
import { FeatureCards } from "@/components/payslip/feature-cards"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileDown, RefreshCw, FileText, Clock, CheckCircle2, XCircle, Coins, Zap } from "lucide-react"
import type { ModelResult, ExtractionResult } from "@/lib/payslip-types"

type AppState = "idle" | "processing" | "success" | "error"

export default function PayslipExtractor() {
  const [state, setState] = useState<AppState>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [modelResults, setModelResults] = useState<ModelResult[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    setState("processing")
    setError("")
    setModelResults([])
    setActiveTab("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract-payslip", {
        method: "POST",
        body: formData,
      })

      const result: ExtractionResult = await response.json()

      if (!response.ok || !result.success || result.results.length === 0) {
        throw new Error("Errore durante l'estrazione dei dati")
      }

      setModelResults(result.results)
      // Set first successful model as active tab
      const firstSuccess = result.results.find((r) => r.success)
      setActiveTab(firstSuccess?.model || result.results[0].model)
      setState("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si e verificato un errore imprevisto")
      setState("error")
    }
  }, [])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setModelResults([])
    setActiveTab("")
    setError("")
    setState("idle")
  }, [])

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }, [selectedFile, handleFileSelect])

  const handleExportJSON = useCallback((modelResult: ModelResult) => {
    if (!modelResult.data) return

    const dataStr = JSON.stringify(modelResult.data, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `busta-paga-${modelResult.modelLabel.replace(/\s+/g, "-").toLowerCase()}-${modelResult.data.periodo.mese}-${modelResult.data.periodo.anno}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

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
          {state === "success" && modelResults.length > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {modelResults.filter((r) => r.success).length}/{modelResults.length} modelli
            </Badge>
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

          {/* Results with Tabs */}
          {state === "success" && modelResults.length > 0 && (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  {modelResults.map((result) => (
                    <TabsTrigger
                      key={result.model}
                      value={result.model}
                      className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="truncate">{result.modelLabel}</span>
                      {result.processingTime && (
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          ({(result.processingTime / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {modelResults.map((result) => (
                  <TabsContent key={result.model} value={result.model} className="mt-6">
                    {result.success && result.data ? (
                      <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {/* Processing Time */}
                          <div className="rounded-lg border bg-card p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              Tempo
                            </div>
                            <p className="mt-1 text-lg font-semibold">
                              {((result.processingTime || 0) / 1000).toFixed(1)}s
                            </p>
                          </div>
                          
                          {/* Token Usage / Pages for OCR */}
                          {result.usage && (
                            <div className="rounded-lg border bg-card p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Zap className="h-3.5 w-3.5" />
                                {result.model === "mistral-ocr-latest" ? "Pagine" : "Token"}
                              </div>
                              {result.model === "mistral-ocr-latest" ? (
                                <p className="mt-1 text-lg font-semibold">
                                  {result.usage.inputTokens} {result.usage.inputTokens === 1 ? "pagina" : "pagine"}
                                </p>
                              ) : (
                                <>
                                  <p className="mt-1 text-lg font-semibold">
                                    {result.usage.totalTokens.toLocaleString("it-IT")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {result.usage.inputTokens.toLocaleString("it-IT")} in / {result.usage.outputTokens.toLocaleString("it-IT")} out
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Cost */}
                          {result.cost && (
                            <div className="rounded-lg border bg-card p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Coins className="h-3.5 w-3.5" />
                                Costo
                              </div>
                              <p className="mt-1 text-lg font-semibold">
                                ${result.cost.totalCost.toFixed(4)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${result.cost.inputCost.toFixed(4)} + ${result.cost.outputCost.toFixed(4)}
                              </p>
                            </div>
                          )}
                          
                          {/* Confidence */}
                          {result.data.confidenza && (
                            <div className="rounded-lg border bg-card p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Confidenza
                              </div>
                              <p className={`mt-1 text-lg font-semibold ${
                                result.data.confidenza >= 80 ? "text-green-600" : 
                                result.data.confidenza >= 60 ? "text-yellow-600" : "text-red-600"
                              }`}>
                                {result.data.confidenza}%
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <PayslipResults data={result.data} />
                        
                        {/* Export Button for this model */}
                        <div className="flex justify-center">
                          <Button
                            onClick={() => handleExportJSON(result)}
                            variant="outline"
                            className="gap-2"
                          >
                            <FileDown className="h-4 w-4" />
                            Scarica JSON ({result.modelLabel})
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
                        <XCircle className="mx-auto h-10 w-10 text-destructive" />
                        <h3 className="mt-3 font-semibold text-destructive">
                          Estrazione Fallita
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {result.error || "Il modello non e riuscito ad estrarre i dati dal documento."}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
              
              {/* Global Action */}
              <div className="flex justify-center pt-4">
                <Button onClick={handleClear} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Nuova Estrazione
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
            Powered by <strong>Mistral OCR</strong>, <strong>Gemini</strong> e <strong>Pixtral</strong>
          </p>
          <p className="mt-1">
            I tuoi dati non vengono mai salvati. Elaborazione conforme al GDPR.
          </p>
        </div>
      </footer>
    </main>
  )
}
