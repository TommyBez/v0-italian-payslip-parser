import "server-only"

import { Mistral } from "@mistralai/mistralai"

let mistralClient: Mistral | null = null

export function getMistralClient() {
  const apiKey = process.env.MISTRAL_API_KEY

  if (!apiKey) {
    throw new Error("Missing MISTRAL_API_KEY environment variable")
  }

  if (!mistralClient) {
    mistralClient = new Mistral({ apiKey })
  }

  return mistralClient
}
