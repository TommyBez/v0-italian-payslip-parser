"use client"

import { useCallback, useState } from "react"
import { Upload, FileText, Image, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  INVALID_PAYSLIP_FILE_ALERT,
  SUPPORTED_PAYSLIP_ACCEPT,
  SUPPORTED_PAYSLIP_FORMATS_LABEL,
} from "@/lib/payslip-extraction/config"
import { isSupportedPayslipMimeType } from "@/lib/payslip-extraction/input"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isProcessing: boolean
  selectedFile: File | null
  onClear: () => void
}

export function UploadZone({
  onFileSelect,
  isProcessing,
  selectedFile,
  onClear,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [onFileSelect]
  )

  const handleFile = (file: File) => {
    if (!isSupportedPayslipMimeType(file.type)) {
      alert(INVALID_PAYSLIP_FILE_ALERT)
      return
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    onFileSelect(file)
  }

  const handleClear = () => {
    setPreview(null)
    onClear()
  }

  if (selectedFile) {
    return (
      <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 p-4 md:p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          {preview ? (
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-muted">
              <img
                src={preview}
                alt="Anteprima busta paga"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border bg-muted">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <p className="font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {isProcessing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary md:justify-start">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Estrazione dati in corso...</span>
              </div>
            )}
          </div>
          {!isProcessing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-2 top-2 md:relative md:right-0 md:top-0"
              aria-label="Rimuovi file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200",
        "flex flex-col items-center justify-center gap-4 p-8 md:p-12",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input
        type="file"
        accept={SUPPORTED_PAYSLIP_ACCEPT}
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Carica busta paga"
      />
      <div className="flex items-center gap-3 text-muted-foreground">
        <Upload className="h-8 w-8 md:h-10 md:w-10" />
        <Image className="h-6 w-6 md:h-8 md:w-8" />
        <FileText className="h-6 w-6 md:h-8 md:w-8" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground md:text-xl">
          Trascina qui la tua busta paga
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          oppure clicca per selezionare un file
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Formati supportati: {SUPPORTED_PAYSLIP_FORMATS_LABEL}
        </p>
      </div>
    </div>
  )
}
