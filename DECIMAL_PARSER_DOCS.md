# Estrattore Busta Paga - Documentazione Tecnica

## Supporto per Formato Decimale Italiano con Riga Verticale

### Problema Affrontato

I cedolini italiani utilizzano frequentemente la **riga verticale (|)** come separatore decimale, in particolare nei sistemi di stampa e acquisizione di immagini legacy. Questo crea una sfida nell'estrazione automatica dei dati numerici.

**Esempi di formati riscontrati:**
- `1.234|56` = 1.234,56 EUR (formato con separatore verticale)
- `100|00` = 100,00 EUR
- `15|50` = 15,50 EUR

### Soluzione Implementata

#### 1. **Decimal Parser** (`lib/decimal-parser.ts`)

Fornisce tre funzioni principali:

##### `parseItalianDecimal(value: string | number | null)`
Converte stringhe di numeri italiani in valori numerici JavaScript:
- Gestisce riga verticale: `"1.234|56"` → `1234.56`
- Gestisce formato europeo: `"1.234,56"` → `1234.56`
- Gestisce formato misto: `"1234,56"` → `1234.56`
- Ritorna `null` se il valore non è valido

```typescript
parseItalianDecimal("2.500|80")  // → 2500.8
parseItalianDecimal("1.234,56")  // → 1234.56
parseItalianDecimal("100|00")    // → 100
```

##### `formatItalianNumber(value: number, decimals = 2)`
Formatta numeri secondo le convenzioni italiane per la visualizzazione:
```typescript
formatItalianNumber(1234.56, 2)  // → "1.234,56"
formatItalianNumber(2500.8, 2)   // → "2.500,80"
```

##### `parsePayslipNumbers<T>(obj: T)`
Elaborazione ricorsiva di un oggetto cedolino, convertendo automaticamente tutti i campi numerici:
```typescript
const payslip = {
  retribuzioneLorda: "2.500|00",
  contributiInps: { totale: "156|50" },
  ...
}
const parsed = parsePayslipNumbers(payslip)
// Tutti i campi numerici sono ora number validi
```

#### 2. **AI Prompt Enhancement**

L'API di estrazione (`app/api/extract-payslip/route.ts`) include istruzioni esplicite per il modello AI:

- **Conservare il separatore verticale**: L'AI mantiene la riga verticale come appare nel documento
- **No conversione automatica AI**: L'AI NON prova a convertire il formato, preservandolo così com'è
- **Post-processing**: Il server converte i valori dopo la risposta del modello

**Vantaggio**: Massima fedeltà al documento originale + conversione garantita lato server

#### 3. **Pipeline di Elaborazione**

```
Immagine/PDF Cedolino
        ↓
[AI Extraction con Mistral Large 3]
        ↓
Output raw (con "|" preservato)
        ↓
parsePayslipNumbers()
        ↓
Valori numerici standardizzati
        ↓
API Response JSON
        ↓
[Frontend Display]
        ↓
formatItalianNumber() per visualizzazione
```

#### 4. **Interfaccia Utente**

- **DecimalFormatInfo**: Componente informativo che spiega il formato ai utenti
- **Visualizzazione**: I valori vengono formattati come `1.234,56 €` per coerenza con le convenzioni italiane

### Campi Supportati

Il parser automaticamente converte i seguenti campi quando contengono valori numerici come stringhe:

**Componenti di Stipendio:**
- `importo`, `aliquota`, `retribuzioneLorda`, `totale`

**Detrazioni:**
- `imponibile`, `imposta`, `detrazioni`, `netto`
- `regionale`, `comunale`

**Benefici:**
- `accantonamento`, `maturate`, `godute`, `residue`
- `maturati`, `goduti`, `residui`

**Pay Details:**
- `nettoInBusta`, `giorniLavorati`, `oreLavorate`, `confidenza`

### Testing

Per testare il parser:

```typescript
import { parseItalianDecimal, formatItalianNumber } from '@/lib/decimal-parser'

// Test parsing
const result = parseItalianDecimal("2.500|80")
console.assert(result === 2500.8)

// Test formatting
const formatted = formatItalianNumber(2500.8, 2)
console.assert(formatted === "2.500,80")

// Test recursive parsing
const data = {
  importo: "1.234|56",
  nested: { aliquota: "8|47" }
}
const parsed = parsePayslipNumbers(data)
console.assert(parsed.importo === 1234.56)
console.assert(parsed.nested.aliquota === 8.47)
```

### Considerazioni di Robustezza

1. **Cedolini Moderni**: Molti cedolini moderni usano direttamente il formato europeo (`1.234,56`). Il parser supporta entrambi.

2. **Ambiguità**: La riga verticale è univoca nel contesto numerico italiano, evitando ambiguità.

3. **Privacy**: I numeri vengono processati solo per l'estrazione dei dati, nessuna memorizzazione.

4. **Edge Cases**: Il parser gestisce:
   - Valori nulli: `null` → `null`
   - Stringhe vuote: `""` → `null`
   - Formati misti: `"1.234,56"` e `"1.234|56"` entrambi validi
   - Numeri già convertiti: `1234.56` → `1234.56`

### Integrazione Futura

Il sistema è pronto per:
- Supporto di altri separatori decimali (se necessario)
- Validazione di intervalli numerici
- Export in diversi formati (CSV, PDF, etc.)
- Elaborazione batch di cedolini

## Architettura del Sistema

```
app/
├── api/
│   └── extract-payslip/
│       └── route.ts (Post-processing con parsePayslipNumbers)
├── page.tsx (Main UI)
└── layout.tsx

components/payslip/
├── upload-zone.tsx
├── payslip-results.tsx (Visualizzazione con formatItalianNumber)
├── decimal-format-info.tsx (Info per utenti)
└── ...

lib/
├── payslip-types.ts (Schema Zod)
└── decimal-parser.ts (Parsing utilities)
```

## Privacy e Sicurezza

- Nessun dato viene memorizzato sul server
- I cedolini vengono processati in tempo reale
- Gli IBAN vengono mascherati nella visualizzazione
- Supporto per GDPR: i dati non vengono cachati
