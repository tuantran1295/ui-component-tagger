from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import uuid
import shutil
import os

app = FastAPI()

# CORS settings for local dev; adapt for prod!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or list: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "./models/best.pt"
# CLASS_MAP = {0: "button", 1: "input", 2: "radio", 3: "dropdown"}

CLASS_MAP = {0: "button", 4: "input", 6: "radio", 2: "dropdown"}

# - button      (0)
# - checkbox    (1)
# - dropdown    (2)
# - icon        (3)
# - input       (4)
# - label       (5)
# - radio       (6)   <--- class_id = 6
# - slider      (7)
# - switch      (8)
# - table       (9)

# Load YOLO model once on server startup
yolo_model = YOLO(MODEL_PATH)

@app.post("/predict/")
async def predict_ui(file: UploadFile = File(...)):
    # Save to disk temporarily (YOLO expects filepath)
    temp_name = f"tmp_{uuid.uuid4()}.png"
    with open(temp_name, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # YOLOv8 inference
    res = yolo_model(temp_name)
    os.remove(temp_name)
    result = []
    boxes = res[0].boxes
    if boxes is not None:
        for box in boxes:
            cls_id = int(box.cls.item())
            if cls_id == 0 or cls_id == 2 or cls_id == 4 or cls_id == 6:
                xyxy = box.xyxy.cpu().numpy()[0]  # [x1, y1, x2, y2]
                tag = CLASS_MAP.get(cls_id, "unknown")
                coords = [round(float(x), 2) for x in xyxy]
                result.append({"box": coords, "tag": tag})
    return result