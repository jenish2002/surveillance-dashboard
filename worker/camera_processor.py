import cv2
import threading
import time
import requests
import os


from ultralytics import YOLO
from datetime import datetime, UTC
from dotenv import load_dotenv

load_dotenv()

model = YOLO("yolov8n.pt")

API_URL = os.getenv("API_URL")


class CameraProcessor:
    def __init__(self, camera_id: str, rtsp_url: str):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url

        self.running = False
        self.thread = None
        self.last_alert_time = None

    def start(self):
        self.running = True

        self.thread = threading.Thread(
            target=self.process_stream,
            daemon=True,
        )

        self.thread.start()

    def stop(self):
        self.running = False

    def process_stream(self):
        print(f"[CONNECTING] Camera: {self.camera_id}")

        cap = cv2.VideoCapture(self.rtsp_url)

        if not cap.isOpened():
            print(f"[ERROR] Failed to connect camera: {self.camera_id}")
            return

        frame_count = 0

        while self.running:
            success, frame = cap.read()

            if not success:
                print(f"[ERROR] Frame read failed for camera: {self.camera_id}")

                time.sleep(1)
                continue

            frame_count += 1

            # Process every 10th frame
            if frame_count % 10 != 0:
                continue

            self.detect_person(frame)

        cap.release()

        print(f"[STOPPED] Camera: {self.camera_id}")

    def detect_person(self, frame):
        results = model(frame, verbose=False)

        for result in results:
            for box in result.boxes:

                cls = int(box.cls[0])

                if result.names[cls] != "person":
                    continue

                confidence = float(box.conf[0])

                now = datetime.now(UTC)

                if self.last_alert_time and (now - self.last_alert_time).seconds < 30:
                    continue

                self.last_alert_time = now

                print(
                    f"[DETECTED] Camera: {self.camera_id} " f"Person ({confidence:.2f})"
                )

                self.send_alert(confidence)

    def send_alert(self, confidence):
        try:
            response = requests.post(
                f"{API_URL}/alerts/internal",
                json={
                    "cameraId": self.camera_id,
                    "label": "person",
                    "confidence": confidence,
                    "timestamp": datetime.now(UTC).replace(microsecond=0).isoformat(),
                },
                timeout=5,
            )

            print(f"[ALERT SENT] Status: {response.status_code}")

        except Exception as e:
            print(f"Failed to send alert: {e}")
