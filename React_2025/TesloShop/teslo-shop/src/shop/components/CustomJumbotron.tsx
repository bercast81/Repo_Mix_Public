import { Button } from "../../components/ui/button"

interface Props {
    title: string
    subtitle?: string
}

export const CustomJumbotron = ({title, subtitle}: Props) => {

const defaultSubtitle = 'Ropa elegante y minimalista inspirada en el diseño futurista de Tesla. Calidad premium para un estilo atemporal'

  return (
      <section className="py-10 px-4 lg:px-8 bg-muted/30">
        <div className="container mx-auto text-center">
          <h1 className="font-montserrat text-3xl lg:text-5xl font-medium tracking-tight mb-6">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {subtitle ?? defaultSubtitle}
          </p>
        </div>
      </section>
  )
}
