'use client'

import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function DecimalFormatInfo() {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-300">
              Formato Decimali Italiano
            </p>
            <p className="text-blue-800 dark:text-blue-400">
              I cedolini italiani utilizzano spesso la riga verticale (|) come separatore decimale.
              Ad esempio: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">1.234|56</code> significa 1.234,56 EUR
            </p>
            <p className="text-blue-700 dark:text-blue-500 text-xs">
              Il sistema converte automaticamente questi formati in valori numerici standard.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
