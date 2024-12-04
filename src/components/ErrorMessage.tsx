import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>エラーが発生しました</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm underline hover:no-underline"
          >
            再試行する
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
} 