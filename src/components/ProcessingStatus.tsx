import { Card, CardContent } from "./ui/card"
import { Progress } from "./ui/progress"

interface ProcessingStatusProps {
  isProcessing: boolean
  stage: 'downloading' | 'transcribing' | 'complete' | null
  progress: number
}

export function ProcessingStatus({ isProcessing, stage, progress }: ProcessingStatusProps) {
  if (!isProcessing && !stage) return null

  const stageMessages = {
    downloading: '動画をダウンロード中...',
    transcribing: '文字起こしを実行中...',
    complete: '処理が完了しました！'
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {stage ? stageMessages[stage] : '処理を準備中...'}
            </p>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  )
} 