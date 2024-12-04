import whisper
import tempfile
import os
from typing import Literal, Optional, Callable
import ffmpeg
import yt_dlp
from functools import partial
import logging
from .exceptions import (
    VideoDownloadError,
    TranscriptionError,
    ModelLoadError,
    InvalidVideoURLError
)
import time

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WhisperModel = Literal["tiny", "base", "small", "medium", "large"]

class WhisperService:
    def __init__(self):
        self._models = {}
    
    def get_model(self, model_name: WhisperModel):
        try:
            if model_name not in self._models:
                logger.info(f"Loading Whisper model: {model_name}")
                self._models[model_name] = whisper.load_model(model_name)
            return self._models[model_name]
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            raise ModelLoadError(f"モデル '{model_name}' の読み込みに失敗しました: {str(e)}")
    
    def download_audio(self, url: str, status_callback: Optional[Callable] = None) -> str:
        """YouTubeからオーディオをダウンロードし、一時ファイルとして保存"""
        try:
            def progress_hook(d):
                if d['status'] == 'downloading':
                    if status_callback and 'total_bytes' in d:
                        progress = (d['downloaded_bytes'] / d['total_bytes']) * 50
                        status_callback("downloading", progress)
                elif d['status'] == 'finished':
                    if status_callback:
                        status_callback("downloading", 50)
                elif d['status'] == 'error':
                    logger.error(f"Download error: {d.get('error')}")
                    raise VideoDownloadError(f"ダウンロードエラー: {d.get('error')}")

            temp_dir = tempfile.mkdtemp()
            try:
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'wav',
                    }],
                    'outtmpl': os.path.join(temp_dir, '%(id)s.%(ext)s'),
                    'progress_hooks': [progress_hook],
                }

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    logger.info(f"Downloading audio from: {url}")
                    info = ydl.extract_info(url, download=True)
                    video_id = info['id']
                    audio_path = os.path.join(temp_dir, f"{video_id}.wav")
                    
                    # ファイルの存在確認と待機
                    max_retries = 10
                    retry_count = 0
                    while not os.path.exists(audio_path) and retry_count < max_retries:
                        time.sleep(0.5)
                        retry_count += 1
                        
                    if not os.path.exists(audio_path):
                        raise VideoDownloadError("音声ファイルの生成に失敗しました")
                        
                    return audio_path

            except yt_dlp.utils.DownloadError as e:
                logger.error(f"YouTube download error: {str(e)}")
                raise VideoDownloadError(f"動画のダウンロードに失敗しました: {str(e)}")
                
        except Exception as e:
            logger.error(f"Unexpected error during download: {str(e)}")
            raise VideoDownloadError(f"予期せぬエラーが発生しました: {str(e)}")
        finally:
            # 一時ディレクトリは transcribe メソッドで後で削除さるため、ここでは削除しない
            pass

    async def transcribe(
        self,
        url: str,
        model_name: WhisperModel = "base",
        language: Optional[str] = None,
        status_callback: Optional[Callable] = None
    ) -> dict:
        """動画の文字起こしを実行"""
        audio_path = None
        try:
            # URLの検証
            if not url or not isinstance(url, str):
                raise InvalidVideoURLError("無効なURLが指定されました")

            # オーディオをダウンロード
            logger.info(f"Starting transcription process for URL: {url}")
            audio_path = self.download_audio(url, status_callback)
            
            if status_callback:
                status_callback("transcribing", 50)
            
            # モデルを取得
            model = self.get_model(model_name)
            
            # 文字起こしを実行（言語自動検出を有効に）
            logger.info(f"Starting transcription with model: {model_name}")
            result = model.transcribe(
                audio_path,
                task="translate" if language else "transcribe",  # 翻訳先言語が指定されている場合は翻訳タスクを実行
                language=None,  # 自動検出を有効に
            )
            
            if status_callback:
                status_callback("complete", 100)
            
            logger.info("Transcription completed successfully")
            response = {
                "text": result["text"],
                "segments": result["segments"],
                "detected_language": result["language"],  # 検出された言語
            }
            
            # 翻訳先言語が指定されている場合、その言語情報も追加
            if language:
                response["target_language"] = language
            
            return response
            
        except (VideoDownloadError, ModelLoadError, InvalidVideoURLError) as e:
            # 既知のエラーは再送
            raise e
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise TranscriptionError(f"文字起こしに失敗しました: {str(e)}")
        finally:
            # 一時ファイルの削除
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temporary file: {str(e)}")

whisper_service = WhisperService() 