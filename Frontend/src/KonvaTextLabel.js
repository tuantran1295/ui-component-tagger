import React from "react";
import { Text, Group, Rect } from "react-konva";

function KonvaTextLabel({ x, y, text }) {
  // Basic label with a background
  return (
    <Group x={x} y={y - 16}>
      <Rect
        width={Math.max(60, text.length * 10)}
        height={20}
        fill="white"
        stroke="#2196f3"
        strokeWidth={1}
        cornerRadius={4}
        opacity={0.7}
      />
      <Text
        x={5}
        y={2}
        text={text}
        fontSize={14}
        fill="#1976d2"
        fontStyle="bold"
      />
    </Group>
  );
}
export default KonvaTextLabel;
