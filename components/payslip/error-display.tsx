"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  message: string
  onRetry: () => void
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-destructive">
            Errore nell&apos;Estrazione
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Riprova
          </Button>
        </div>
        <div className="mt-2 max-w-md rounded-lg bg-muted p-3 text-left text-sm text-muted-foreground">
          <p className="font-medium">Suggerimenti:</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Assicurati che l&apos;immagine sia leggibile e ben illuminata</li>
            <li>Verifica che il documento sia una busta paga italiana</li>
            <li>Prova con un file di qualita superiore</li>
            <li>Se il problema persiste, prova con un formato diverso (PDF o immagine)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
