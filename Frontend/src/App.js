import React, { useRef, useState } from "react";
import { Button, MenuItem, Select, Box } from "@mui/material";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import KonvaTextLabel from "./KonvaTextLabel";
import axios from "axios";

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
  const [boxes, setBoxes] = useState([]);         // {box: [x1,y1,x2,y2], tag}
  const [newBox, setNewBox] = useState(null);     // Drawing box {x1,y1,x2,y2}
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);
  const [predicting, setPredicting] = useState(false);

  // Drawing new box
  const handleMouseDown = (e) => {
    if (!image) return;
    const pos = e.target.getStage().getPointerPosition();
    setNewBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  };
  const handleMouseMove = (e) => {
    if (!newBox || !image) return;
    const pos = e.target.getStage().getPointerPosition();
    setNewBox({ ...newBox, x2: pos.x, y2: pos.y });
  };
  const handleMouseUp = () => {
    if (!newBox || !image) return;
    let { x1, y1, x2, y2 } = newBox;
    // (ensure coordinates are top-left to bottom-right)
    let box = [Math.min(x1,x2), Math.min(y1,y2), Math.max(x1,x2), Math.max(y1,y2)];
    setBoxes([...boxes, { box, tag: selectedTag }]);
    setNewBox(null);
  };

  const handleImgUpload = (e) => {
    if (!e.target.files?.[0]) return;
    setImgFile(e.target.files[0]);
    setImgURL(URL.createObjectURL(e.target.files[0]));
    setBoxes([]);
  };

  const handleExport = () => {
    const data = JSON.stringify(boxes, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], {type:'application/json'}));
    a.download = "annotation.json";
    a.click();
  };

  const handlePredict = async () => {
    if (!imgFile) return;
    setPredicting(true);
    const form = new FormData();
    form.append("file", imgFile);
    try {
      const res = await axios.post("http://localhost:8000/predict/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBoxes(res.data);
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
          style={{display:"none"}}
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
        <Button onClick={handleExport} variant="outlined" disabled={!boxes.length}>
          Export JSON
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
              {image && <KonvaImage image={image} width={image.width} height={image.height} />}
              {(boxes || []).map((b, i) => (
                <React.Fragment key={i}>
                  <Rect
                    x={b.box[0]}
                    y={b.box[1]}
                    width={b.box[2] - b.box[0]}
                    height={b.box[3] - b.box[1]}
                    stroke="#2196f3"
                    strokeWidth={2}
                  />
                  <KonvaTextLabel x={b.box[0]} y={b.box[1]} text={b.tag} />
                </React.Fragment>
              ))}
              {newBox && (
                <Rect
                  x={Math.min(newBox.x1, newBox.x2)}
                  y={Math.min(newBox.y1, newBox.y2)}
                  width={Math.abs(newBox.x1 - newBox.x2)}
                  height={Math.abs(newBox.y1 - newBox.y2)}
                  stroke="red"
                  dash={[4,2]}
                  strokeWidth={2}
                />
              )}
            </Layer>
          </Stage>
        )}
        {!imgURL && <div style={{color:"#888", padding:40, textAlign:"center"}}>Upload an image to start annotating.</div>}
      </Box>
    </Box>
  );
}

export default App;