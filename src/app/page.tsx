'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isValidYouTubeUrl, extractYouTubeVideoId } from '@/lib/youtube'
import { getVideoInfo, processVideo, type VideoInfo, type TranscriptionResponse } from '@/lib/api'
import { TranscriptionResult } from '@/components/TranscriptionResult'
import { ProcessingStatus } from '@/components/ProcessingStatus'
import { ErrorMessage } from '@/components/ErrorMessage'

export default function YouTubeTranscriptionApp() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [language, setLanguage] = useState('english')
  const [subtitlePosition, setSubtitlePosition] = useState('bottom')
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [error, setError] = useState<string>('')
  const [model, setModel] = useState<WhisperModel>('base')
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResponse | null>(null)
  const [processingStage, setProcessingStage] = useState<'downloading' | 'transcribing' | 'complete' | null>(null)
  const [progress, setProgress] = useState(0)

  const handleRetry = useCallback(async () => {
    if (!youtubeUrl) return;
    setError('');
    handleSubmit(new Event('submit') as any);
  }, [youtubeUrl]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    if (isProcessing && videoInfo) {
      ws = new WebSocket(`ws://localhost:8000/ws/${videoInfo.video_id}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          setIsProcessing(false);
          ws?.close();
          return;
        }
        
        setProcessingStage(data.stage);
        setProgress(data.progress);
        
        if (data.stage === 'complete') {
          setIsProcessing(false);
          ws?.close();
        }
      };

      ws.onerror = () => {
        setError('WebSocket接続エラー');
        setIsProcessing(false);
      };

      ws.onclose = () => {
        if (isProcessing) {
          setError('サーバーとの接続が切断されました');
          setIsProcessing(false);
        }
      };
    }

    return () => {
      ws?.close();
    };
  }, [isProcessing, videoInfo]);

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setYoutubeUrl(url)
    setVideoInfo(null)
    setError('')
    setProcessingStage(null)
    setProgress(0)
    setTranscriptionResult(null)
    
    if (url && !isValidYouTubeUrl(url)) {
      setUrlError('有効なYouTube URLを入力してください')
    } else {
      setUrlError('')
      if (url) {
        try {
          const info = await getVideoInfo({ 
            url, 
            language, 
            subtitle_position: subtitlePosition,
            model 
          })
          setVideoInfo(info)
        } catch (err) {
          setError(err instanceof Error ? err.message : '動画情報の取得に失敗しました')
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setUrlError('有効なYouTube URLを入力してください')
      return
    }

    setIsProcessing(true)
    setError('')
    setTranscriptionResult(null)

    try {
      const response = await processVideo({
        url: youtubeUrl,
        language,
        subtitle_position: subtitlePosition,
        model
      })
      setTranscriptionResult(response.data.transcription)
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理の開始に失敗しました')
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>YouTube 文字起こし & 翻訳アプリ</CardTitle>
          <CardDescription>YouTube URLを入力し、言語とテロップ位置を選択して文字起こしと翻訳を開始します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input 
                  id="youtubeUrl" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={youtubeUrl}
                  onChange={handleUrlChange}
                  required
                  className={urlError ? 'border-red-500' : ''}
                />
                {urlError && (
                  <p className="text-sm text-red-500">{urlError}</p>
                )}
              </div>

              {videoInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{videoInfo.title}</h3>
                  {videoInfo.thumbnail_url && (
                    <img 
                      src={videoInfo.thumbnail_url} 
                      alt={videoInfo.title || '動画サムネイル'} 
                      className="w-full max-w-sm mx-auto rounded-lg mb-2"
                    />
                  )}
                  {videoInfo.duration && (
                    <p className="text-sm text-gray-600">
                      動画の長さ: {Math.floor(videoInfo.duration / 60)}分{videoInfo.duration % 60}秒
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="model">Whisperモデル</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="モデルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiny">Tiny (最速・低精度)</SelectItem>
                    <SelectItem value="base">Base (推奨)</SelectItem>
                    <SelectItem value="small">Small (高精度)</SelectItem>
                    <SelectItem value="medium">Medium (より高精度)</SelectItem>
                    <SelectItem value="large">Large (最高精度・低速)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label>翻訳先の言語を選択</Label>
                <RadioGroup value={language} onValueChange={setLanguage}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english">英語に翻訳</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chinese" id="chinese" />
                    <Label htmlFor="chinese">中国語に翻訳</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="japanese" id="japanese" />
                    <Label htmlFor="japanese">日本語に翻訳</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground mt-1">
                  ※ 動画の言語は自動で検出されます
                </p>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="subtitlePosition">テロップ位置</Label>
                <Select value={subtitlePosition} onValueChange={setSubtitlePosition}>
                  <SelectTrigger id="subtitlePosition">
                    <SelectValue placeholder="テロップ位置を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">上</SelectItem>
                    <SelectItem value="middle">中央</SelectItem>
                    <SelectItem value="bottom">下</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={handleRetry}
            />
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isProcessing || !!urlError || !videoInfo} 
            onClick={handleSubmit} 
            className="w-full"
          >
            {isProcessing ? '処理中...' : '文字起こしと翻訳を開始'}
          </Button>
        </CardFooter>
      </Card>

      <ProcessingStatus 
        isProcessing={isProcessing}
        stage={processingStage}
        progress={progress}
      />

      {transcriptionResult && videoInfo && (
        <TranscriptionResult 
          result={transcriptionResult}
          videoId={videoInfo.video_id}
        />
      )}
    </div>
  )
}

