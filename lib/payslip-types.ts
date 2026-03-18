import { z } from "zod"

// Italian Payslip (Busta Paga) Schema
export const employeeDetailsSchema = z.object({
  nome: z.string().nullable().describe("Nome del dipendente cosi come riportato in busta paga."),
  cognome: z.string().nullable().describe("Cognome del dipendente cosi come riportato in busta paga."),
  codiceFiscale: z.string().nullable().describe("Codice fiscale del dipendente. Mantenere il formato alfanumerico esattamente come presente nel documento."),
  matricola: z.string().nullable().describe("Matricola o identificativo interno del dipendente, se presente."),
  dataNascita: z.string().nullable().describe("Data di nascita del dipendente, mantenendo il formato testuale presente nel documento."),
  luogoNascita: z.string().nullable().describe("Luogo di nascita del dipendente, se riportato."),
  indirizzo: z.string().nullable().describe("Indirizzo del dipendente, se riportato in busta paga."),
  dataAssunzione: z.string().nullable().describe("Data di assunzione, mantenendo il formato testuale presente nel documento."),
  qualifica: z.string().nullable().describe("Qualifica o mansione del dipendente indicata in busta paga."),
  livello: z.string().nullable().describe("Livello o inquadramento contrattuale del dipendente."),
  ccnl: z.string().nullable().describe("Contratto collettivo nazionale di lavoro applicato, se indicato."),
})

export const companyDetailsSchema = z.object({
  ragioneSociale: z.string().nullable().describe("Ragione sociale o denominazione dell'azienda cosi come riportata in busta paga."),
  partitaIva: z.string().nullable().describe("Partita IVA dell'azienda. Mantenere il formato numerico esattamente come presente nel documento."),
  codiceFiscaleAzienda: z.string().nullable().describe("Codice fiscale dell'azienda, se distinto dalla partita IVA."),
  indirizzo: z.string().nullable().describe("Indirizzo dell'azienda riportato nel documento."),
  inps: z.string().nullable().describe("Posizione, matricola o codice INPS dell'azienda, se presente."),
  inail: z.string().nullable().describe("Posizione, codice o riferimento INAIL dell'azienda, se presente."),
})

export const periodSchema = z.object({
  mese: z.string().nullable().describe("Mese di riferimento della busta paga, come indicato nel documento."),
  anno: z.string().nullable().describe("Anno di riferimento della busta paga, come indicato nel documento."),
  giorniLavorati: z.number().nullable().describe("Numero di giorni lavorati nel periodo. Estrarre solo il valore numerico."),
  oreLavorate: z.number().nullable().describe("Numero di ore lavorate nel periodo. Estrarre solo il valore numerico."),
})

export const salaryComponentSchema = z.object({
  descrizione: z.string().describe("Descrizione della voce retributiva esattamente come appare in busta paga."),
  importo: z.number().describe("Importo della voce retributiva. Estrarre solo il valore numerico, senza simboli o valuta."),
  tipo: z.string().nullable().describe("Tipologia della voce retributiva, ad esempio fisso, variabile, straordinario o altra classificazione se esplicitamente deducibile dal testo."),
})

export const deductionSchema = z.object({
  descrizione: z.string().describe("Descrizione della trattenuta o detrazione cosi come riportata nel documento."),
  importo: z.number().describe("Importo della trattenuta o detrazione. Estrarre solo il valore numerico, senza simboli o valuta."),
  aliquota: z.number().nullable().describe("Aliquota o percentuale associata alla trattenuta, se esplicitamente presente. Estrarre solo il valore numerico."),
})

export const payslipDataSchema = z.object({
  dipendente: employeeDetailsSchema.describe("Dati anagrafici del dipendente riportati in busta paga."),
  azienda: companyDetailsSchema.describe("Dati identificativi dell'azienda riportati in busta paga."),
  periodo: periodSchema.describe("Periodo di riferimento della busta paga."),
  
  retribuzioneLorda: z.number().nullable().describe("Importo della retribuzione lorda del periodo. Estrarre solo il valore numerico, senza simboli o valuta."),
  
  vociRetributive: z.array(salaryComponentSchema).describe("Elenco delle voci retributive presenti in busta paga, come paga base, indennita, premi o straordinari."),
  
  contributiInps: z.object({
    totale: z.number().nullable().describe("Totale dei contributi INPS trattenuti o indicati in busta paga. Estrarre solo il valore numerico."),
    aliquota: z.number().nullable().describe("Aliquota contributiva INPS, se esplicitamente presente. Estrarre solo il numero o la percentuale senza simboli aggiuntivi."),
    dettaglio: z.array(z.object({
      descrizione: z.string().describe("Descrizione della singola voce contributiva INPS cosi come appare nel documento."),
      importo: z.number().describe("Importo della singola voce contributiva INPS. Estrarre solo il valore numerico."),
    })).nullable().describe("Dettaglio delle singole voci di contributi INPS presenti nel documento."),
  }).describe("Dati relativi ai contributi previdenziali INPS."),
  
  irpef: z.object({
    imponibile: z.number().nullable().describe("Imponibile fiscale IRPEF del periodo. Estrarre solo il valore numerico."),
    imposta: z.number().nullable().describe("Importo dell'imposta IRPEF lorda o indicata in busta paga. Estrarre solo il valore numerico."),
    detrazioni: z.number().nullable().describe("Totale delle detrazioni IRPEF applicate, se presente. Estrarre solo il valore numerico."),
    netto: z.number().nullable().describe("IRPEF netta dopo detrazioni, se esplicitamente riportata. Estrarre solo il valore numerico."),
  }).describe("Dati fiscali relativi all'IRPEF."),
  
  addizionali: z.object({
    regionale: z.number().nullable().describe("Importo dell'addizionale regionale IRPEF. Estrarre solo il valore numerico."),
    comunale: z.number().nullable().describe("Importo dell'addizionale comunale IRPEF. Estrarre solo il valore numerico."),
  }).describe("Addizionali IRPEF regionale e comunale."),
  
  altreDetrazioni: z.array(deductionSchema).nullable().describe("Altre trattenute o detrazioni presenti in busta paga oltre a IRPEF e contributi."),
  
  tfr: z.object({
    accantonamento: z.number().nullable().describe("Quota TFR maturata o accantonata nel periodo. Estrarre solo il valore numerico."),
    destinazione: z.string().nullable().describe("Destinazione del TFR, ad esempio azienda o fondo pensione, se indicata esplicitamente."),
  }).nullable().describe("Dati relativi al trattamento di fine rapporto (TFR)."),
  
  ferie: z.object({
    maturate: z.number().nullable().describe("Numero di ferie maturate nel periodo o nel progressivo, secondo quanto riportato nel documento."),
    godute: z.number().nullable().describe("Numero di ferie godute o utilizzate, se presente."),
    residue: z.number().nullable().describe("Numero di ferie residue disponibili, se presente."),
  }).nullable().describe("Situazione ferie riportata in busta paga."),
  
  permessi: z.object({
    maturati: z.number().nullable().describe("Numero di ore o giorni di permessi maturati, secondo l'unita riportata nel documento."),
    goduti: z.number().nullable().describe("Numero di ore o giorni di permessi goduti o utilizzati, se presente."),
    residui: z.number().nullable().describe("Numero di ore o giorni di permessi residui, se presente."),
  }).nullable().describe("Situazione permessi riportata in busta paga."),
  
  nettoInBusta: z.number().nullable().describe("Importo netto da corrispondere al dipendente, spesso indicato come netto in busta o netto a pagare. Estrarre solo il valore numerico."),
  
  notePagamento: z.object({
    dataPagamento: z.string().nullable().describe("Data di pagamento o valuta indicata nel documento, mantenendo il formato testuale presente."),
    modalitaPagamento: z.string().nullable().describe("Modalita di pagamento indicata in busta paga, ad esempio bonifico o contanti."),
    iban: z.string().nullable().describe("IBAN riportato nel documento. Mantenere eventuale mascheramento o formato parziale presente per privacy."),
  }).nullable().describe("Informazioni relative al pagamento della retribuzione."),
  
  // confidenza: z.number().nullable().describe("AI confidence score 0-100"),
  // note: z.string().nullable().describe("Additional notes or warnings from extraction"),
})

export type EmployeeDetails = z.infer<typeof employeeDetailsSchema>
export type CompanyDetails = z.infer<typeof companyDetailsSchema>
export type Period = z.infer<typeof periodSchema>
export type SalaryComponent = z.infer<typeof salaryComponentSchema>
export type Deduction = z.infer<typeof deductionSchema>
export type PayslipData = z.infer<typeof payslipDataSchema>

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cachedInputTokens?: number
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: "USD"
}

export interface ModelResult {
  model: string
  modelLabel: string
  success: boolean
  data: PayslipData | null
  error?: string
  processingTime?: number
  usage?: TokenUsage
  cost?: CostBreakdown
}

export interface ExtractionResult {
  success: boolean
  results: ModelResult[]
}
