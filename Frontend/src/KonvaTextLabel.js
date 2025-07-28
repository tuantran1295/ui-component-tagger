import React from "react";
import { Text, Group, Rect } from "react-konva";

/**
 * color: label border/text color
 * size: font size (default 14)
 * noBg: if true, don't show background rectangle (e.g. for delete X)
 */
function KonvaTextLabel({ x, y, text, color = "#2196f3", size = 14, noBg = false }) {
  return (
    <Group x={x} y={y - 16}>
      {!noBg && (
        <Rect
          width={Math.max(60, text.length * 10)}
          height={size + 6}
          fill="white"
          stroke={color}
          strokeWidth={1}
          cornerRadius={4}
          opacity={0.7}
        />
      )}
      <Text
        x={5}
        y={2}
        text={text}
        fontSize={size}
        fill={color}
        fontStyle="bold"
        fontFamily="sans-serif"
        align="left"
      />
    </Group>
  );
}
export default KonvaTextLabel;