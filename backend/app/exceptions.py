from fastapi import HTTPException

class VideoProcessingError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)

class VideoDownloadError(VideoProcessingError):
    def __init__(self, detail: str = "動画のダウンロードに失敗しました"):
        super().__init__(detail=detail)

class TranscriptionError(VideoProcessingError):
    def __init__(self, detail: str = "文字起こしの処理に失敗しました"):
        super().__init__(detail=detail)

class InvalidVideoURLError(VideoProcessingError):
    def __init__(self, detail: str = "無効な動画URLです"):
        super().__init__(detail=detail)

class UnsupportedLanguageError(VideoProcessingError):
    def __init__(self, detail: str = "サポートされていない言語です"):
        super().__init__(detail=detail)

class ModelLoadError(VideoProcessingError):
    def __init__(self, detail: str = "モデルの読み込みに失敗しました"):
        super().__init__(detail=detail) 