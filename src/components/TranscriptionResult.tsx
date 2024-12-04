import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Download } from "lucide-react"
import { TranscriptionResponse } from "@/lib/api"

interface TranscriptionResultProps {
  result: TranscriptionResponse
  videoId: string
}

export function TranscriptionResult({ result, videoId }: TranscriptionResultProps) {
  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      en: '英語',
      ja: '日本語',
      zh: '中国語',
      // 必要に応じて他の言語を追加
    }
    return languages[code] || code
  }

  const handleDownload = () => {
    window.location.href = `http://localhost:8000/api/video/download/${videoId}`
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>文字起こし結果</CardTitle>
            <p className="text-sm text-muted-foreground">
              検出された言語: {getLanguageName(result.detected_language)}
              {result.target_language && ` → ${getLanguageName(result.target_language)}に翻訳`}
            </p>
          </div>
          <Button onClick={handleDownload} className="ml-4">
            <Download className="mr-2 h-4 w-4" />
            テロップ付き動画をダウンロード
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">全文</h3>
            <p className="whitespace-pre-wrap">{result.text}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">タイムライン</h3>
            <div className="space-y-2">
              {result.segments.map((segment, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">
                    {Math.floor(segment.start / 60)}:{String(Math.floor(segment.start % 60)).padStart(2, '0')} - 
                    {Math.floor(segment.end / 60)}:{String(Math.floor(segment.end % 60)).padStart(2, '0')}
                  </div>
                  <p>{segment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 