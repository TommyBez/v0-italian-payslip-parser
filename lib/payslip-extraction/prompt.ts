export const PAYSLIP_EXTRACTION_SYSTEM_PROMPT = `Extract structured data from an Italian payslip.

Use only information supported by the document.
Return null for missing or unclear fields.
Normalize monetary values as decimal numbers.
Mask sensitive values like IBAN when present.
Add ambiguities or inconsistencies to the note field.
Return data that matches the provided schema exactly.`
