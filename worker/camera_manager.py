from camera_processor import CameraProcessor

running_cameras = {}


def start_camera(camera_id: str, rtsp_url: str):

    if camera_id in running_cameras:
        return {"success": False, "message": "Camera is already running."}

    processor = CameraProcessor(
        camera_id=camera_id,
        rtsp_url=rtsp_url,
        on_stop=remove_camera,
    )

    processor.start()

    running_cameras[camera_id] = processor

    print(f"[STARTED] Camera: {camera_id}")

    return {"success": True, "message": "Camera started successfully."}


def stop_camera(camera_id: str):

    if camera_id not in running_cameras:
        return {"success": False, "message": "Camera is not running."}

    processor = running_cameras[camera_id]

    processor.stop()

    running_cameras.pop(camera_id, None)

    print(f"[STOPPED] Camera: {camera_id}")

    return {"success": True, "message": "Camera stopped successfully."}


def get_running_cameras():
    return list(running_cameras.keys())


def remove_camera(camera_id: str):
    running_cameras.pop(camera_id, None)

    print(f"[REMOVED] Camera {camera_id} removed from manager.")
