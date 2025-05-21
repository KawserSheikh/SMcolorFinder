import React, { useRef, useState, useEffect } from "react";
import colorData from "./colorData";

interface Color {
  Code: string;
  Name: string;
  Hex: string;
  R: number;
  G: number;
  B: number;
}

const getDistance = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) => {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [mainMatch, setMainMatch] = useState<Color | null>(null);
  const [suggestions, setSuggestions] = useState<Color[]>([]);

  // Draw image to canvas when imageURL changes
  useEffect(() => {
    if (!imageURL) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageURL;
  }, [imageURL]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageURL(url);
    setMainMatch(null);
    setSuggestions([]);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // Adjust click position to canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const distances = colorData.map((color) => ({
      ...color,
      distance: getDistance(r, g, b, color.R, color.G, color.B),
    }));

    distances.sort((a, b) => a.distance - b.distance);

    const main = distances[0];
    const top3 = distances.slice(1, 4);

    setMainMatch(main);
    setSuggestions(top3);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>🎨 Color Finder</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: 20 }}
      />

      {imageURL && (
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            border: "1px solid #ccc",
            maxWidth: "100%",
            height: "auto",
            display: "block",
            marginBottom: 20,
            cursor: "crosshair",
          }}
        />
      )}

      {mainMatch && (
        <div>
          <h2>🎯 Closest Color Found:</h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              border: "1px solid #ccc",
              borderRadius: 5,
              padding: 10,
              minWidth: 200,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 5,
                backgroundColor: mainMatch.Hex,
              }}
            />
            <div>
              <div style={{ fontWeight: "bold" }}>{mainMatch.Code}</div>
              <div>{mainMatch.Name}</div>
              <div>{mainMatch.Hex}</div>
            </div>
          </div>

          <h3>🎨 Top 3 Suggestions:</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {suggestions.map((color, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 200,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 5,
                    backgroundColor: color.Hex,
                  }}
                />
                <div>
                  <div style={{ fontWeight: "bold" }}>{color.Code}</div>
                  <div>{color.Name}</div>
                  <div>{color.Hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
