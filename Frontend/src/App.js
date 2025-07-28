import React, {useRef, useState} from "react";
import {Button, MenuItem, Select, Box, IconButton} from "@mui/material";
import {Stage, Layer, Rect, Image as KonvaImage, Group, Text} from "react-konva";
import KonvaTextLabel from "./KonvaTextLabel";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close"; // For delete icon

// Helper to load image for Konva
function useImage(url) {
    const [image, setImage] = useState(null);
    React.useEffect(() => {
        if (!url) return;
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => setImage(img);
    }, [url]);
    return image;
}

const TAGS = ["button", "input", "radio", "dropdown"];

function App() {
    const [imgFile, setImgFile] = useState(null);
    const [imgURL, setImgURL] = useState(null);
    const image = useImage(imgURL);
    const stageRef = useRef();

    // state for boxes
    const [boxes, setBoxes] = useState([]); // Array of {box: [], tag, source}
    const [newBox, setNewBox] = useState(null); // Drawing box {x1,y1,x2,y2}
    const [selectedTag, setSelectedTag] = useState(TAGS[0]);
    const [predicting, setPredicting] = useState(false);

    // NEW: keep prediction boxes separately for export
    const [predictionBoxes, setPredictionBoxes] = useState([]);

    // Drawing new box
    const handleMouseDown = (e) => {
        if (!image) return;
        const pos = e.target.getStage().getPointerPosition();
        setNewBox({x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y});
    };
    const handleMouseMove = (e) => {
        if (!newBox || !image) return;
        const pos = e.target.getStage().getPointerPosition();
        setNewBox({...newBox, x2: pos.x, y2: pos.y});
    };
    const handleMouseUp = () => {
        if (!newBox || !image) return;
        let {x1, y1, x2, y2} = newBox;
        let box = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
        setBoxes([...boxes, {box, tag: selectedTag, source: "user"}]); // MODIFIED: add source
        setNewBox(null);
    };

    const handleImgUpload = (e) => {
        if (!e.target.files?.[0]) return;
        setImgFile(e.target.files[0]);
        setImgURL(URL.createObjectURL(e.target.files[0]));
        setBoxes([]);
        setPredictionBoxes([]); // NEW: clear predictions on new image
    };

    // NEW: delete box function (by index and 'source' type)
    const handleDeleteBox = (idx, source) => {
        if (source === "user") {
            setBoxes(boxes.filter((b, i) => i !== idx));
        } else {
            setPredictionBoxes(predictionBoxes.filter((b, i) => i !== idx));
        }
    };

    // Export ONLY user-annotated boxes
    const handleExportUser = () => {
        const userData = boxes.map(b => ({box: b.box, tag: b.tag}));
        const data = JSON.stringify(userData, null, 2);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data], {type: "application/json"}));
        a.download = "user_annotation.json";
        a.click();
    };

    // Export ONLY prediction boxes
    const handleExportPrediction = () => {
        const predData = predictionBoxes.map(b => ({box: b.box, tag: b.tag}));
        const data = JSON.stringify(predData, null, 2);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data], {type: "application/json"}));
        a.download = "prediction.json";
        a.click();
    };

    // When using prediction, update only prediction boxes, keep manual boxes
    const handlePredict = async () => {
        if (!imgFile) return;
        setPredicting(true);
        const form = new FormData();
        form.append("file", imgFile);
        try {
            const res = await axios.post("http://localhost:8000/predict/", form, {
                headers: {"Content-Type": "multipart/form-data"},
            });
            // attach source: "prediction"
            const preds = res.data.map((b) => ({
                ...b,
                source: "prediction"
            }));
            setPredictionBoxes(preds);
        } catch (err) {
            alert("Prediction failed");
        }
        setPredicting(false);
    };

    return (
        <Box p={2}>
            <Box mb={2} display="flex" alignItems="center" gap={2}>
                <input
                    accept="image/*"
                    style={{display: "none"}}
                    id="upload"
                    type="file"
                    onChange={handleImgUpload}
                />
                <label htmlFor="upload">
                    <Button variant="contained" component="span">
                        Upload Image
                    </Button>
                </label>
                {imgFile && <span>{imgFile.name}</span>}
                <Select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} size="small">
                    {TAGS.map(tag => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
                </Select>
                <Button onClick={handleExportUser} variant="outlined" disabled={!boxes.length}>
                    Export User Annotations
                </Button>
                <Button onClick={handleExportPrediction} variant="outlined" disabled={!predictionBoxes.length}>
                    Export Predictions
                </Button>
                <Button onClick={handlePredict} variant="contained" color="secondary" disabled={!imgFile || predicting}>
                    {predicting ? "Predicting..." : "Predict"}
                </Button>
            </Box>
            <Box border={1} borderColor="grey.400" p={1} style={{width: 'fit-content', maxWidth: 900, maxHeight: 700}}>
                {imgURL && (
                    <Stage
                        ref={stageRef}
                        width={image?.width || 800}
                        height={image?.height || 600}
                        style={{border: "1px solid #ccc"}}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        <Layer>
                            {image && <KonvaImage image={image} width={image.width} height={image.height}/>}
                            {/* Render user boxes (blue) */}
                            {(boxes || []).map((b, i) => (
                                <Group key={`user_${i}`}>
                                    <Rect
                                        x={b.box[0]}
                                        y={b.box[1]}
                                        width={b.box[2] - b.box[0]}
                                        height={b.box[3] - b.box[1]}
                                        stroke="#2196f3" // blue
                                        strokeWidth={2}
                                        dash={[]}
                                    />
                                    <KonvaTextLabel x={b.box[0]} y={b.box[1]} text={b.tag} color="#2196f3"/>
                                    {/* "Delete" Icon at top-right */}
                                    <Group
                                        x={b.box[2] - 10}
                                        y={b.box[1] - 14}
                                        onClick={() => handleDeleteBox(i, "user")}
                                        style={{cursor: "pointer"}}
                                    >
                                        {/* Rect as background */}
                                        <Rect width={18} height={18} fill="white" stroke="#2196f3" cornerRadius={6}
                                              opacity={0.85}/>
                                        {/* '✕' on top, centered */}
                                        <Text
                                            x={0}
                                            y={0}
                                            width={18}
                                            height={18}
                                            text="✕"
                                            fontSize={18}
                                            fontStyle="bold"
                                            fill="#2196f3"
                                            align="center"
                                            verticalAlign="middle"
                                            listening={false}
                                        />
                                    </Group>
                                </Group>
                            ))}
                            {/* Render model prediction boxes (green) */}
                            {(predictionBoxes || []).map((b, i) => (
                                <Group key={`pred_${i}`}>
                                    <Rect
                                        x={b.box[0]}
                                        y={b.box[1]}
                                        width={b.box[2] - b.box[0]}
                                        height={b.box[3] - b.box[1]}
                                        stroke="#43a047" // green
                                        strokeWidth={2}
                                        dash={[6, 4]}
                                    />
                                    <KonvaTextLabel x={b.box[0]} y={b.box[1]} text={b.tag} color="#43a047"/>
                                    {/* "Delete" Icon at top-right */}
                                    <Group
                                        x={b.box[2] - 10}
                                        y={b.box[1] - 14}
                                        onClick={() => handleDeleteBox(i, "prediction")}
                                        style={{cursor: "pointer"}}
                                    >
                                        <Rect width={18} height={18} fill="white" stroke="#43a047" cornerRadius={6}
                                              opacity={0.85}/>
                                        <Text
                                            x={0}
                                            y={0}
                                            width={18}
                                            height={18}
                                            text="✕"
                                            fontSize={18}
                                            fontStyle="bold"
                                            fill="#43a047"
                                            align="center"
                                            verticalAlign="middle"
                                            listening={false}
                                        />
                                    </Group>
                                </Group>
                            ))}
                            {/* Drawing box preview (red) */}
                            {newBox && (
                                <Rect
                                    x={Math.min(newBox.x1, newBox.x2)}
                                    y={Math.min(newBox.y1, newBox.y2)}
                                    width={Math.abs(newBox.x1 - newBox.x2)}
                                    height={Math.abs(newBox.y1 - newBox.y2)}
                                    stroke="red"
                                    dash={[4, 2]}
                                    strokeWidth={2}
                                />
                            )}
                        </Layer>
                    </Stage>
                )}
                {!imgURL && <div style={{color: "#888", padding: 40, textAlign: "center"}}>Upload an image to start
                    annotating.</div>}
            </Box>
        </Box>
    );
}

export default App;
