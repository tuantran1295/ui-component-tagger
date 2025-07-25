```markdown
# UI Annotation Tool Backend

Backend server for UI annotation and prediction using FastAPI and YOLOv8.

---

## Features

- FastAPI server with a `/predict/` endpoint for bounding box and tag prediction of UI elements (button, input, radio, dropdown) from uploaded images.
- Integration with YOLOv8 model (via Ultralytics).
- Command-line evaluation script to compare LLM/model predictions with human annotation ground truth.

---

## Folder Structure

```
backend/
│
├── main.py                # FastAPI app
├── requirements.txt       # Python dependencies
├── models/
│    └── best.pt           # YOLOv8 weights (you provide or train!)
├── evaluation/
│    └── evaluate.py       # Evaluate CLI tool
```

---

## Installation

### 1. Clone and go to backend directory

```bash
git clone <your-repo-url>
cd backend
```

### 2. Create Python Virtual Environment

```bash
python -m venv venv
source venv/bin/activate     # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Download or Train YOLOv8 Weights

- Place your YOLOv8 model weights file (e.g. `best.pt`) in `backend/models/`
- The model must be trained for four classes: button, input, radio, dropdown.
- For training help, see: [Ultralytics YOLOv8 Docs](https://docs.ultralytics.com/)

---

## Running the Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- The prediction endpoint will be live at: [http://localhost:8000/predict/](http://localhost:8000/predict/)
- Accepts POST requests with an uploaded image (`multipart/form-data`, field name: `file`)
- Returns predicted bounding boxes and classes in JSON format

---

## Evaluate Predictions

To compare model/LLM predictions against ground truth annotations:

### Directory Layout Example

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

### Run Evaluation Script

```bash
python evaluation/evaluate.py --ground-truth ground_truth --predictions predictions
```

- Outputs per-tag precision, recall, F1, and macro averages using IoU ≥ 0.5 for correctness.
- Both folders should contain annotation files with matching filenames in the standard format:

```json
[
    {"box": [x1, y1, x2, y2], "tag": "button"},
    {"box": [x1, y1, x2, y2], "tag": "input"}
]
```

---

## Notes

- Default CORS settings allow requests from anywhere (for local/test use).
- Make sure your YOLOv8 weights are correct and compatible with the class order (button, input, radio, dropdown).
- The backend is compatible with a React-based frontend for annotation and prediction.

---

