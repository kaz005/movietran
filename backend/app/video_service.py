# type: ignore
import os
import tempfile
from typing import List
import subprocess
from .exceptions import VideoProcessingError
import logging
import yt_dlp

logger = logging.getLogger(__name__)

class VideoService:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()

    def download_video(self, url: str) -> str:
        """YouTubeから動画をダウンロード"""
        try:
            ydl_opts = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',  # MP4形式を優先
                'outtmpl': os.path.join(self.temp_dir, '%(id)s.%(ext)s'),
                'merge_output_format': 'mp4',  # 出力フォーマットをMP4に指定
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info(f"Downloading video from: {url}")
                info = ydl.extract_info(url, download=True)
                video_path = os.path.join(self.temp_dir, f"{info['id']}.mp4")  # 拡張子を.mp4に固定
                
                if not os.path.exists(video_path):
                    logger.error(f"Downloaded video file not found at: {video_path}")
                    raise VideoProcessingError("動画ファイルの生成に失敗しました")
                
                return video_path
                
        except Exception as e:
            logger.error(f"Failed to download video: {str(e)}")
            raise VideoProcessingError(f"動画のダウンロードに失敗しました: {str(e)}")

    def _create_srt_file(self, segments: List[dict]) -> str:
        """字幕をSRTフォーマットで作成"""
        srt_path = os.path.join(self.temp_dir, "subtitles.srt")
        
        with open(srt_path, "w", encoding="utf-8") as f:
            for i, segment in enumerate(segments, 1):
                start_time = self._format_timestamp(segment["start"])
                end_time = self._format_timestamp(segment["end"])
                text = segment["text"].strip()
                
                f.write(f"{i}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{text}\n\n")
        
        return srt_path

    def _format_timestamp(self, seconds: float) -> str:
        """秒数をSRT形式のタイムスタンプに変換"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        msecs = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{msecs:03d}"

    def add_subtitles(
        self,
        video_path: str,
        segments: List[dict],
        position: str = "bottom",
        font_size: int = 24,
        font_color: str = "white",
        stroke_color: str = "black",
        stroke_width: int = 2,
    ) -> str:
        """FFmpegを使用して動画に字幕を追加"""
        try:
            # SRTファイルを作成
            srt_path = self._create_srt_file(segments)
            output_path = os.path.join(self.temp_dir, "output_with_subtitles.mp4")

            # FFmpegコマンドを構築
            command = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vf", f"subtitles={srt_path}",
                "-c:a", "copy",
                output_path
            ]

            # FFmpegを実行
            result = subprocess.run(command, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                raise VideoProcessingError("字幕の追加に失敗しました")

            return output_path

        except Exception as e:
            logger.error(f"Failed to add subtitles: {str(e)}")
            raise VideoProcessingError(f"字幕の追加に失敗しました: {str(e)}")

    def cleanup(self):
        """一時ファイルの削除"""
        try:
            for file in os.listdir(self.temp_dir):
                file_path = os.path.join(self.temp_dir, file)
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            os.rmdir(self.temp_dir)
        except Exception as e:
            logger.warning(f"Failed to cleanup temporary files: {str(e)}")

video_service = VideoService() 