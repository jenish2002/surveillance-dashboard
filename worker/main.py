from fastapi import FastAPI
from pydantic import BaseModel

from camera_manager import (
    start_camera,
    stop_camera,
    get_running_cameras,
)

app = FastAPI()


class StartCameraPayload(BaseModel):
    cameraId: str
    rtspUrl: str


class StopCameraPayload(BaseModel):
    cameraId: str


@app.get("/")
def root():
    return {"message": "Worker is running."}


@app.get("/cameras")
def list_running_cameras():
    return get_running_cameras()


@app.post("/start")
def start_camera_endpoint(
    payload: StartCameraPayload,
):
    result = start_camera(
        payload.cameraId,
        payload.rtspUrl,
    )

    return result


@app.post("/stop")
def stop_camera_endpoint(
    payload: StopCameraPayload,
):
    result = stop_camera(
        payload.cameraId,
    )

    return result
