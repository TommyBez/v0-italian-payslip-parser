export const PAYSLIP_EXTRACTION_SYSTEM_PROMPT = `Extract structured data from an Italian payslip.

Use only information supported by the document.
Return null for missing or unclear fields.
Normalize monetary values as decimal numbers.
Mask sensitive values like IBAN when present.
Return data that matches the provided schema exactly.
Don't make calculations, just extract the data.`
