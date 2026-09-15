import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Dimensionado para o público do app: altura mínima em vez de fixa (o campo
        // cresce se a pessoa aumentar a fonte), respiro interno maior e borda de 2px.
        // Sem `md:text-sm`: essa classe derrubava o texto para 14px em tablet.
        "flex min-h-[60px] w-full rounded-senior border-2 border-input bg-background px-4 py-3 text-senior-base ring-offset-background file:border-0 file:bg-transparent file:text-senior-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
