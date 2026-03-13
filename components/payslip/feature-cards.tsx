import { FileText, Zap, Shield, Smartphone } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Estrazione Automatica",
    description: "Carica la tua busta paga e ottieni tutti i dati strutturati in pochi secondi.",
  },
  {
    icon: Zap,
    title: "AI Avanzata",
    description: "Utilizziamo modelli AI all'avanguardia per un'estrazione precisa dei dati.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "I tuoi documenti non vengono mai salvati. Elaborazione sicura e confidenziale.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Scatta una foto dal telefono e caricala direttamente dall'app.",
  },
]

export function FeatureCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
            <feature.icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold">{feature.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}
