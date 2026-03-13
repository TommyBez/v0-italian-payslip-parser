"use client"

import { PayslipData, SalaryComponent, Deduction } from "@/lib/payslip-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Building2,
  Calendar,
  Euro,
  TrendingDown,
  Wallet,
  Sun,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PayslipResultsProps {
  data: PayslipData
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/D"
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "N/D"
  return String(value)
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null
  
  const isHigh = confidence >= 80
  const isMedium = confidence >= 50 && confidence < 80
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        isHigh && "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400",
        isMedium && "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
        !isHigh && !isMedium && "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
      )}
    >
      {isHigh ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : isMedium ? (
        <Info className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      Affidabilita: {confidence}%
    </Badge>
  )
}

function DataRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "flex justify-between gap-2 py-1.5 text-sm",
      highlight && "font-semibold"
    )}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "text-right",
        highlight ? "text-primary" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function PayslipResults({ data }: PayslipResultsProps) {
  return (
    <div className="space-y-6">
      {/* Header with confidence */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">Risultati Estrazione</h2>
          <p className="text-sm text-muted-foreground">
            Periodo: {formatValue(data.periodo.mese)} {formatValue(data.periodo.anno)}
          </p>
        </div>
        <ConfidenceBadge confidence={data.confidenza} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lordo</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(data.retribuzioneLorda)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Trattenute Totali</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(
                (data.contributiInps?.totale || 0) +
                (data.irpef?.netto || 0) +
                (data.addizionali?.regionale || 0) +
                (data.addizionali?.comunale || 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Netto in Busta</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(data.nettoInBusta)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Employee Details */}
        <SectionCard title="Dati Dipendente" icon={User}>
          <div className="space-y-1">
            <DataRow
              label="Nome e Cognome"
              value={`${formatValue(data.dipendente.nome)} ${formatValue(data.dipendente.cognome)}`}
            />
            <DataRow label="Codice Fiscale" value={formatValue(data.dipendente.codiceFiscale)} />
            <DataRow label="Matricola" value={formatValue(data.dipendente.matricola)} />
            <DataRow label="Qualifica" value={formatValue(data.dipendente.qualifica)} />
            <DataRow label="Livello" value={formatValue(data.dipendente.livello)} />
            <DataRow label="CCNL" value={formatValue(data.dipendente.ccnl)} />
            <DataRow label="Data Assunzione" value={formatValue(data.dipendente.dataAssunzione)} />
          </div>
        </SectionCard>

        {/* Company Details */}
        <SectionCard title="Dati Azienda" icon={Building2}>
          <div className="space-y-1">
            <DataRow label="Ragione Sociale" value={formatValue(data.azienda.ragioneSociale)} />
            <DataRow label="Partita IVA" value={formatValue(data.azienda.partitaIva)} />
            <DataRow label="Codice Fiscale" value={formatValue(data.azienda.codiceFiscaleAzienda)} />
            <DataRow label="INPS" value={formatValue(data.azienda.inps)} />
            <DataRow label="INAIL" value={formatValue(data.azienda.inail)} />
          </div>
        </SectionCard>

        {/* Period Details */}
        <SectionCard title="Periodo di Riferimento" icon={Calendar}>
          <div className="space-y-1">
            <DataRow label="Mese" value={formatValue(data.periodo.mese)} />
            <DataRow label="Anno" value={formatValue(data.periodo.anno)} />
            <DataRow label="Giorni Lavorati" value={formatValue(data.periodo.giorniLavorati)} />
            <DataRow label="Ore Lavorate" value={formatValue(data.periodo.oreLavorate)} />
          </div>
        </SectionCard>

        {/* Salary Components */}
        <SectionCard title="Voci Retributive" icon={Euro}>
          <div className="space-y-1">
            {data.vociRetributive.length > 0 ? (
              data.vociRetributive.map((voce: SalaryComponent, index: number) => (
                <DataRow
                  key={index}
                  label={voce.descrizione}
                  value={formatCurrency(voce.importo)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna voce disponibile</p>
            )}
            <div className="mt-2 border-t pt-2">
              <DataRow
                label="Totale Lordo"
                value={formatCurrency(data.retribuzioneLorda)}
                highlight
              />
            </div>
          </div>
        </SectionCard>

        {/* INPS Contributions */}
        <SectionCard title="Contributi INPS" icon={TrendingDown}>
          <div className="space-y-1">
            <DataRow
              label="Aliquota"
              value={data.contributiInps.aliquota ? `${data.contributiInps.aliquota}%` : "N/D"}
            />
            {data.contributiInps.dettaglio?.map((item, index) => (
              <DataRow
                key={index}
                label={item.descrizione}
                value={formatCurrency(item.importo)}
              />
            ))}
            <div className="mt-2 border-t pt-2">
              <DataRow
                label="Totale INPS"
                value={formatCurrency(data.contributiInps.totale)}
                highlight
              />
            </div>
          </div>
        </SectionCard>

        {/* IRPEF */}
        <SectionCard title="IRPEF" icon={TrendingDown}>
          <div className="space-y-1">
            <DataRow label="Imponibile" value={formatCurrency(data.irpef.imponibile)} />
            <DataRow label="Imposta Lorda" value={formatCurrency(data.irpef.imposta)} />
            <DataRow label="Detrazioni" value={formatCurrency(data.irpef.detrazioni)} />
            <div className="mt-2 border-t pt-2">
              <DataRow
                label="IRPEF Netta"
                value={formatCurrency(data.irpef.netto)}
                highlight
              />
            </div>
          </div>
        </SectionCard>

        {/* Addizionali */}
        <SectionCard title="Addizionali" icon={TrendingDown}>
          <div className="space-y-1">
            <DataRow label="Addizionale Regionale" value={formatCurrency(data.addizionali.regionale)} />
            <DataRow label="Addizionale Comunale" value={formatCurrency(data.addizionali.comunale)} />
            <div className="mt-2 border-t pt-2">
              <DataRow
                label="Totale Addizionali"
                value={formatCurrency(
                  (data.addizionali.regionale || 0) + (data.addizionali.comunale || 0)
                )}
                highlight
              />
            </div>
          </div>
        </SectionCard>

        {/* Net Pay */}
        <SectionCard title="Netto in Busta" icon={Wallet}>
          <div className="space-y-1">
            <DataRow
              label="Netto"
              value={formatCurrency(data.nettoInBusta)}
              highlight
            />
            {data.notePagamento && (
              <>
                <DataRow
                  label="Data Pagamento"
                  value={formatValue(data.notePagamento.dataPagamento)}
                />
                <DataRow
                  label="Modalita"
                  value={formatValue(data.notePagamento.modalitaPagamento)}
                />
                {data.notePagamento.iban && (
                  <DataRow label="IBAN" value={formatValue(data.notePagamento.iban)} />
                )}
              </>
            )}
          </div>
        </SectionCard>

        {/* TFR */}
        {data.tfr && (
          <SectionCard title="TFR" icon={Euro}>
            <div className="space-y-1">
              <DataRow
                label="Accantonamento"
                value={formatCurrency(data.tfr.accantonamento)}
              />
              <DataRow
                label="Destinazione"
                value={formatValue(data.tfr.destinazione)}
              />
            </div>
          </SectionCard>
        )}

        {/* Ferie */}
        {data.ferie && (
          <SectionCard title="Ferie" icon={Sun}>
            <div className="space-y-1">
              <DataRow
                label="Maturate"
                value={`${formatValue(data.ferie.maturate)} giorni`}
              />
              <DataRow
                label="Godute"
                value={`${formatValue(data.ferie.godute)} giorni`}
              />
              <DataRow
                label="Residue"
                value={`${formatValue(data.ferie.residue)} giorni`}
                highlight
              />
            </div>
          </SectionCard>
        )}

        {/* Permessi */}
        {data.permessi && (
          <SectionCard title="Permessi / ROL" icon={Clock}>
            <div className="space-y-1">
              <DataRow
                label="Maturati"
                value={`${formatValue(data.permessi.maturati)} ore`}
              />
              <DataRow
                label="Goduti"
                value={`${formatValue(data.permessi.goduti)} ore`}
              />
              <DataRow
                label="Residui"
                value={`${formatValue(data.permessi.residui)} ore`}
                highlight
              />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Notes */}
      {data.note && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Note</p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {data.note}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
