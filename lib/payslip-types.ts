import { z } from "zod"

// Italian Payslip (Busta Paga) Schema
export const employeeDetailsSchema = z.object({
  nome: z.string().nullable().describe("Employee first name"),
  cognome: z.string().nullable().describe("Employee surname"),
  codiceFiscale: z.string().nullable().describe("Italian tax code (Codice Fiscale)"),
  matricola: z.string().nullable().describe("Employee ID number"),
  dataNascita: z.string().nullable().describe("Date of birth"),
  luogoNascita: z.string().nullable().describe("Place of birth"),
  indirizzo: z.string().nullable().describe("Address"),
  dataAssunzione: z.string().nullable().describe("Hire date"),
  qualifica: z.string().nullable().describe("Job qualification/title"),
  livello: z.string().nullable().describe("Job level/grade"),
  ccnl: z.string().nullable().describe("National collective labor agreement applied"),
})

export const companyDetailsSchema = z.object({
  ragioneSociale: z.string().nullable().describe("Company legal name"),
  partitaIva: z.string().nullable().describe("VAT number"),
  codiceFiscaleAzienda: z.string().nullable().describe("Company tax code"),
  indirizzo: z.string().nullable().describe("Company address"),
  inps: z.string().nullable().describe("INPS registration number"),
  inail: z.string().nullable().describe("INAIL registration number"),
})

export const periodSchema = z.object({
  mese: z.string().nullable().describe("Pay period month"),
  anno: z.string().nullable().describe("Pay period year"),
  giorniLavorati: z.number().nullable().describe("Days worked"),
  oreLavorate: z.number().nullable().describe("Hours worked"),
})

export const salaryComponentSchema = z.object({
  descrizione: z.string().describe("Description of the salary component"),
  importo: z.number().describe("Amount in EUR"),
  tipo: z.string().nullable().describe("Type: fisso (fixed), variabile (variable), straordinario (overtime)"),
})

export const deductionSchema = z.object({
  descrizione: z.string().describe("Description of the deduction"),
  importo: z.number().describe("Amount in EUR"),
  aliquota: z.number().nullable().describe("Rate/percentage if applicable"),
})

export const payslipDataSchema = z.object({
  dipendente: employeeDetailsSchema.describe("Employee personal details"),
  azienda: companyDetailsSchema.describe("Company details"),
  periodo: periodSchema.describe("Pay period information"),
  
  retribuzioneLorda: z.number().nullable().describe("Gross salary (Retribuzione Lorda)"),
  
  vociRetributive: z.array(salaryComponentSchema).describe("Salary components breakdown"),
  
  contributiInps: z.object({
    totale: z.number().nullable().describe("Total INPS contributions"),
    aliquota: z.number().nullable().describe("INPS contribution rate"),
    dettaglio: z.array(z.object({
      descrizione: z.string(),
      importo: z.number(),
    })).nullable().describe("Breakdown of INPS contributions"),
  }).describe("INPS social security contributions"),
  
  irpef: z.object({
    imponibile: z.number().nullable().describe("Taxable income for IRPEF"),
    imposta: z.number().nullable().describe("IRPEF tax amount"),
    detrazioni: z.number().nullable().describe("Tax deductions applied"),
    netto: z.number().nullable().describe("Net IRPEF after deductions"),
  }).describe("IRPEF income tax details"),
  
  addizionali: z.object({
    regionale: z.number().nullable().describe("Regional tax surcharge"),
    comunale: z.number().nullable().describe("Municipal tax surcharge"),
  }).describe("Regional and municipal tax surcharges"),
  
  altreDetrazioni: z.array(deductionSchema).nullable().describe("Other deductions"),
  
  tfr: z.object({
    accantonamento: z.number().nullable().describe("TFR accrual for the period"),
    destinazione: z.string().nullable().describe("TFR destination (company/fund)"),
  }).nullable().describe("Severance pay (TFR) details"),
  
  ferie: z.object({
    maturate: z.number().nullable().describe("Vacation days accrued"),
    godute: z.number().nullable().describe("Vacation days used"),
    residue: z.number().nullable().describe("Vacation days remaining"),
  }).nullable().describe("Vacation days status"),
  
  permessi: z.object({
    maturati: z.number().nullable().describe("Leave hours accrued"),
    goduti: z.number().nullable().describe("Leave hours used"),
    residui: z.number().nullable().describe("Leave hours remaining"),
  }).nullable().describe("Leave hours status"),
  
  nettoInBusta: z.number().nullable().describe("Net pay (Netto in Busta)"),
  
  notePagamento: z.object({
    dataPagamento: z.string().nullable().describe("Payment date"),
    modalitaPagamento: z.string().nullable().describe("Payment method"),
    iban: z.string().nullable().describe("Bank IBAN (masked for privacy)"),
  }).nullable().describe("Payment notes"),
  
  confidenza: z.number().nullable().describe("AI confidence score 0-100"),
  note: z.string().nullable().describe("Additional notes or warnings from extraction"),
})

export type EmployeeDetails = z.infer<typeof employeeDetailsSchema>
export type CompanyDetails = z.infer<typeof companyDetailsSchema>
export type Period = z.infer<typeof periodSchema>
export type SalaryComponent = z.infer<typeof salaryComponentSchema>
export type Deduction = z.infer<typeof deductionSchema>
export type PayslipData = z.infer<typeof payslipDataSchema>

export interface ExtractionResult {
  success: boolean
  data: PayslipData | null
  error?: string
}
