running_cameras = {}


def start_camera(camera_id: str, rtsp_url: str):

    if camera_id in running_cameras:
        return {"success": False, "message": "Camera is already running."}

    running_cameras[camera_id] = {"status": "running", "rtsp_url": rtsp_url}

    print(f"[STARTED] Camera {camera_id}")

    return {"success": True, "message": "Camera started successfully."}


def stop_camera(camera_id: str):

    if camera_id not in running_cameras:
        return {"success": False, "message": "Camera is not running."}

    del running_cameras[camera_id]

    print(f"[STOPPED] Camera {camera_id}")

    return {"success": True, "message": "Camera stopped successfully."}


def get_running_cameras():
    return running_cameras
