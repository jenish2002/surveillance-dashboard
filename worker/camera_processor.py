import cv2
import threading
import time
import requests
import os


from ultralytics import YOLO
from datetime import datetime, UTC
from dotenv import load_dotenv

FRAME_SKIP_COUNT = 10
ALERT_COOLDOWN_SECONDS = 30
MAX_CONSECUTIVE_FAILURES = 10

load_dotenv()

model = YOLO("yolov8n.pt")

API_URL = os.getenv("API_URL")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")


class CameraProcessor:
    def __init__(
        self,
        camera_id: str,
        rtsp_url: str,
        on_stop=None,
    ):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.on_stop = on_stop

        self.running = False
        self.thread = None
        self.last_alert_time = None

        self.frame_counter = 0
        self.detection_counter = 0
        self.last_stats_sent_at = time.time()

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

        cap = cv2.VideoCapture(
            self.rtsp_url,
            cv2.CAP_FFMPEG,
        )

        if not cap.isOpened():
            self.update_status("ERROR")
            self.running = False

            print(f"[ERROR] Failed to connect camera: {self.camera_id}")

            if self.on_stop:
                self.on_stop(self.camera_id)

            return

        self.update_status("LIVE")

        try:
            frame_count = 0
            failed_attempts = 0

            while self.running:
                success, frame = cap.read()

                if not success:
                    failed_attempts += 1

                    print(
                        f"[ERROR] Frame read failed for camera: {self.camera_id} "
                        f"({failed_attempts}/{MAX_CONSECUTIVE_FAILURES})"
                    )

                    # Stop camera if too many consecutive failures occur
                    if failed_attempts >= MAX_CONSECUTIVE_FAILURES:
                        print(f"[ERROR] Camera disconnected: " f"{self.camera_id}")
                        self.running = False

                        break

                    time.sleep(1)
                    continue

                # Reset failure counter after a successful frame
                failed_attempts = 0
                frame_count += 1

                # Count processed frames for FPS calculation
                self.frame_counter += 1

                # Send stats every 5 seconds
                if time.time() - self.last_stats_sent_at >= 5:
                    self.send_stats()

                # Skip frames to reduce CPU usage
                if frame_count % FRAME_SKIP_COUNT != 0:
                    continue

                self.detect_person(frame)

        except Exception as error:
            self.update_status("ERROR")

            print(f"[ERROR] Camera processing failed " f"for {self.camera_id}: {error}")

        finally:
            cap.release()
            self.update_status("STOPPED")

            print(f"[STOPPED] Camera: {self.camera_id}")

            if self.on_stop:
                self.on_stop(self.camera_id)

    def detect_person(self, frame):
        results = model(frame, verbose=False)

        for result in results:
            for box in result.boxes:

                cls = int(box.cls[0])

                if result.names[cls] != "person":
                    continue

                confidence = float(box.conf[0])

                now = datetime.now(UTC)

                if (
                    self.last_alert_time
                    and (now - self.last_alert_time).total_seconds()
                    < ALERT_COOLDOWN_SECONDS
                ):
                    continue

                self.last_alert_time = now

                print(f"[DETECTED] Camera: {self.camera_id} Person ({confidence:.2f})")

                self.detection_counter += 1

                self.send_alert(confidence)

    def send_alert(self, confidence):
        try:
            response = requests.post(
                f"{API_URL}/alerts/internal",
                headers={
                    "X-Internal-Secret": INTERNAL_API_SECRET,
                },
                json={
                    "cameraId": self.camera_id,
                    "label": "person",
                    "confidence": confidence,
                    "timestamp": datetime.now(UTC).replace(microsecond=0).isoformat(),
                },
                timeout=5,
            )

            if response.ok:
                print(f"[ALERT SENT] Camera: {self.camera_id}")
            else:
                print(
                    f"[ALERT FAILED] Status: {response.status_code} Response: {response.text}"
                )

        except Exception as e:
            print(f"Failed to send alert: {e}")

    def update_status(self, status):
        try:
            response = requests.post(
                f"{API_URL}/cameras/internal/status",
                headers={
                    "X-Internal-Secret": INTERNAL_API_SECRET,
                },
                json={
                    "cameraId": self.camera_id,
                    "status": status,
                },
                timeout=5,
            )

            if response.ok:
                print(f"[STATUS CHANGED] {status}")
            else:
                print(f"[STATUS ERROR] Status not Changed. Response: {response.text}")

        except Exception as error:
            print(f"[STATUS ERROR] {error}")

    def send_stats(self):
        try:
            elapsed_seconds = time.time() - self.last_stats_sent_at

            if elapsed_seconds == 0:
                return

            fps = round(
                self.frame_counter / elapsed_seconds,
                2,
            )

            detections_per_minute = round(
                self.detection_counter * (60 / elapsed_seconds),
                2,
            )

            response = requests.post(
                f"{API_URL}/cameras/internal/stats",
                headers={
                    "X-Internal-Secret": INTERNAL_API_SECRET,
                },
                json={
                    "cameraId": self.camera_id,
                    "fps": fps,
                    "detectionsPerMinute": detections_per_minute,
                },
                timeout=5,
            )

            if response.ok:
                print(f"[STATS SENT] FPS={fps} DPM={detections_per_minute}")
            else:
                print(f"[STATS ERROR] {response.text}")

            # Reset counters
            self.frame_counter = 0
            self.detection_counter = 0

            self.last_stats_sent_at = time.time()

        except Exception as error:
            print(f"[STATS ERROR] {error}")
