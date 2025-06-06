import type React from "react"
import { Info, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type GuidanceType = "info" | "warning" | "success" | "error"

interface FormGuidanceProps {
  type?: GuidanceType
  title: string
  children: React.ReactNode
  className?: string
  icon?: boolean
}

export function FormGuidance({ type = "info", title, children, className, icon = true }: FormGuidanceProps) {
  const getIcon = () => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />
      case "warning":
        return <AlertCircle className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-800"
      case "warning":
        return "border-amber-200 bg-amber-50 text-amber-800"
      case "success":
        return "border-green-200 bg-green-50 text-green-800"
      case "error":
        return "border-red-200 bg-red-50 text-red-800"
    }
  }

  return (
    <Alert className={cn("border-l-4", getStyles(), className)}>
      <div className="flex items-start">
        {icon && <div className="mr-2 mt-0.5">{getIcon()}</div>}
        <div>
          <AlertTitle className="text-sm font-medium">{title}</AlertTitle>
          <AlertDescription className="text-sm mt-1">{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
