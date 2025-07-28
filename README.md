# UI Annotation Tool

End-to-end workflow for annotating, predicting, and reviewing UI elements using a React-based frontend, and FastAPI + YOLOv8 backend.

---

## Project Structure

```
project-root/
│
├── backend/
│    ├── main.py                 # FastAPI app
│    ├── requirements.txt        # Python dependencies
│    ├── models/
│    │    └── best.pt            # YOLOv8 weights (you provide or train!)
│    ├── evaluation/
│    │    └── evaluate.py        # CLI tool for evaluation
│    └── ...                     # Ground truth/prediction folders as needed
│
└── frontend/
     ├── src/                    # React source code
     ├── package.json
     └── ... 
```

---

## Features

### Backend

- FastAPI server with a `/predict/` endpoint: detects and tags UI elements (button, input, radio, dropdown) in images.
- Utilizes YOLOv8 (Ultralytics) for object detection.
- Includes a CLI tool to evaluate predictions against ground truth annotations.

### Frontend

- Upload UI screenshots and annotate with bounding boxes.
- Tag UI elements as Button, Input, Radio, or Dropdown.
- Save/load annotation files in JSON format.
- Request predictions from GPT-4 Vision or YOLOv8 via backend; overlays are shown in green.
- Simple and interactive: React + react-konva + Material UI.

---

## Installation

### Backend

1. **Clone repo & enter backend directory:**
    ```bash
    cd backend
    ```

2. **Create and activate Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate              # On Windows: venv\Scripts\activate
    ```

3. **Install Python dependencies:**
    ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
    ```

4. **Provide YOLOv8 Model Weights:**
    - Place your trained weights (e.g. `best.pt`) in `backend/models/`.
    - Model should be trained for classes: button, input, radio, dropdown.
    - Training guide: [Ultralytics YOLOv8 Docs](https://docs.ultralytics.com/)

5. **Run Backend Server:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    - Prediction endpoint at [http://localhost:8000/predict/](http://localhost:8000/predict/)
    - Accepts POST requests with image (field name: `file`)
    - Returns bounding boxes and class tags as JSON.

### Frontend

1. **Enter frontend directory:**
    ```bash
    cd frontend
    ```

2. **Install Node dependencies and run:**
    ```bash
    npm install
    npm start
    ```

    - App will start at [http://localhost:3000](http://localhost:3000)

---

## Annotation Format

#### Backend API response/ground truth format:
```json
[
    { "box": [x1, y1, x2, y2], "tag": "button" }
]
```

---

## Evaluate Model Predictions (Backend)

To compare model/LLM predictions with human annotations:

**Directory Structure:**
```
backend/
  ground_truth/
    001.json
    002.json
    ...
  predictions/
    001.json
    002.json
    ...
```

**Run Evaluation:**
```bash
python evaluation/evaluate.py --ground-truth ground_truth --predictions predictions
```
- Outputs precision, recall, F1 per tag using IoU ≥ 0.5 criterion.

---

## Notes

- Default CORS is open for local/test use.
- Ensure model class order: button, input, radio, dropdown.
- Frontend and backend communicate via REST API (`/predict/`).
- For best results, keep annotation formats consistent.

---
