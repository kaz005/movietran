from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, Literal, Dict
import yt_dlp
from .whisper_service import whisper_service, WhisperModel
from .video_service import video_service
from .exceptions import VideoProcessingError
import json
import logging
import os

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket接続を管理
active_connections: Dict[str, WebSocket] = {}

class ProcessingStatus:
    def __init__(self, video_id: str):
        self.video_id = video_id
        self.stage = "downloading"
        self.progress = 0

    def update(self, stage: str, progress: float):
        self.stage = stage
        self.progress = progress
        self.broadcast_status()

    async def broadcast_status(self):
        if self.video_id in active_connections:
            try:
                await active_connections[self.video_id].send_json({
                    "stage": self.stage,
                    "progress": self.progress
                })
            except Exception as e:
                logger.error(f"Failed to broadcast status: {str(e)}")

    async def broadcast_error(self, error_message: str):
        if self.video_id in active_connections:
            try:
                await active_connections[self.video_id].send_json({
                    "error": error_message
                })
            except Exception as e:
                logger.error(f"Failed to broadcast error: {str(e)}")

@app.exception_handler(VideoProcessingError)
async def video_processing_error_handler(request, exc: VideoProcessingError):
    logger.error(f"Video processing error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "予期せぬエラーが発生しました"}
    )

@app.websocket("/ws/{video_id}")
async def websocket_endpoint(websocket: WebSocket, video_id: str):
    await websocket.accept()
    active_connections[video_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        if video_id in active_connections:
            del active_connections[video_id]

class VideoRequest(BaseModel):
    url: str
    language: str
    subtitle_position: str
    model: WhisperModel = "base"

class VideoInfo(BaseModel):
    video_id: str
    title: Optional[str] = None
    duration: Optional[int] = None
    thumbnail_url: Optional[str] = None

class TranscriptionResponse(BaseModel):
    text: str
    segments: list
    language: str

@app.get("/")
async def read_root():
    return {"status": "ok", "message": "YouTube Transcription API"}

@app.post("/api/video/info")
async def get_video_info(request: VideoRequest) -> VideoInfo:
    try:
        with yt_dlp.YoutubeDL() as ydl:
            info = ydl.extract_info(request.url, download=False)
            return VideoInfo(
                video_id=info["id"],
                title=info.get("title"),
                duration=info.get("duration"),
                thumbnail_url=info.get("thumbnail")
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/video/transcribe")
async def transcribe_video(request: VideoRequest) -> TranscriptionResponse:
    try:
        video_id = request.url.split("v=")[-1]
        status = ProcessingStatus(video_id)
        
        result = await whisper_service.transcribe(
            url=request.url,
            model_name=request.model,
            language=request.language,
            status_callback=status.update
        )
        return TranscriptionResponse(**result)
    except VideoProcessingError as e:
        await status.broadcast_error(str(e))
        raise e
    except Exception as e:
        error_message = f"文字起こし処理に失敗しました: {str(e)}"
        await status.broadcast_error(error_message)
        raise HTTPException(status_code=500, detail=error_message)

@app.post("/api/video/process")
async def process_video(request: VideoRequest):
    try:
        # 文字起こしを実行
        transcription = await whisper_service.transcribe(
            url=request.url,
            model_name=request.model,
            language=request.language
        )
        
        # 動画をダウンロード
        video_path = video_service.download_video(request.url)
        
        # テロップを追加
        output_path = video_service.add_subtitles(
            video_path=video_path,
            segments=transcription["segments"],
            position=request.subtitle_position
        )
        
        return {
            "status": "success",
            "message": "Video processed successfully",
            "data": {
                "url": request.url,
                "language": request.language,
                "subtitle_position": request.subtitle_position,
                "transcription": transcription,
                "video_path": output_path
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/video/download/{video_id}")
async def download_video(video_id: str):
    try:
        video_path = os.path.join(video_service.temp_dir, "output_with_subtitles.mp4")
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="動画が見つかりません")
        
        return FileResponse(
            video_path,
            media_type="video/mp4",
            filename=f"{video_id}_with_subtitles.mp4"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# アプリケーション終了時のクリーンアップ
@app.on_event("shutdown")
async def shutdown_event():
    video_service.cleanup() 