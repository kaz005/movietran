'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function YouTubeTranscriptionApp() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [language, setLanguage] = useState('english')
  const [subtitlePosition, setSubtitlePosition] = useState('bottom')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    // Here you would typically call your backend API to process the video
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setIsProcessing(false)
      alert(`処理が完了しました！\n選択された言語: ${language}\nテロップ位置: ${subtitlePosition}`)
    }, 3000)
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
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>言語を選択</Label>
                <RadioGroup value={language} onValueChange={setLanguage}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english">英語</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chinese" id="chinese" />
                    <Label htmlFor="chinese">中国語</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="japanese" id="japanese" />
                    <Label htmlFor="japanese">日本語</Label>
                  </div>
                </RadioGroup>
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isProcessing} onClick={handleSubmit} className="w-full">
            {isProcessing ? '処理中...' : '文字起こしと翻訳を開始'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

