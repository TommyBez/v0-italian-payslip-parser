"use client"

import { useState } from "react"
import { Shield, ChevronDown, ChevronUp, Lock, Eye, Trash2, Server } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PrivacyNotice() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-muted bg-muted/30">
      <CardContent className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Privacy e Sicurezza dei Dati</p>
              <p className="text-sm text-muted-foreground">
                I tuoi dati sono protetti e non vengono memorizzati
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <div
          className={cn(
            "grid transition-all duration-300",
            isExpanded ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="grid gap-4 md:grid-cols-2">
              <PrivacyItem
                icon={Lock}
                title="Crittografia End-to-End"
                description="I tuoi documenti vengono trasmessi in modo sicuro e cifrato."
              />
              <PrivacyItem
                icon={Trash2}
                title="Nessuna Memorizzazione"
                description="I file caricati non vengono salvati sui nostri server dopo l'elaborazione."
              />
              <PrivacyItem
                icon={Eye}
                title="Solo Lettura AI"
                description="L'AI analizza il documento solo per estrarre i dati richiesti."
              />
              <PrivacyItem
                icon={Server}
                title="Elaborazione Locale"
                description="I dati estratti rimangono solo nel tuo browser fino alla chiusura della pagina."
              />
            </div>

            <div className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p>
                <strong>Nota:</strong> Questa applicazione utilizza l&apos;intelligenza artificiale
                per estrarre dati dalla tua busta paga. I risultati potrebbero non essere sempre
                accurati al 100%. Ti consigliamo di verificare sempre i dati estratti con il
                documento originale. Per informazioni sensibili (IBAN, codice fiscale), viene
                applicata una mascheratura parziale per proteggere la tua privacy.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PrivacyItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
