import React, { useState, useRef, useEffect } from "react";
import colorData from "./colorData";

function getDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

type Color = {
  Code: string;
  Name: string;
  Hex: string;
  R: number;
  G: number;
  B: number;
};

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mainMatch, setMainMatch] = useState<Color | null>(null);
  const [suggestions, setSuggestions] = useState<Color[]>([]);
  const [allMatches, setAllMatches] = useState<Color[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setMainMatch(null);
      setSuggestions([]);
      setAllMatches([]);
    };
    reader.readAsDataURL(file);
  };

  const findClosestColors = (r: number, g: number, b: number) => {
    const distances = colorData.map((color) => ({
      color,
      dist: getDistance(r, g, b, color.R, color.G, color.B),
    }));
    distances.sort((a, b) => a.dist - b.dist);
    const closest = distances[0].color;
    const top3 = distances.slice(1, 4).map((d) => d.color);
    setMainMatch(closest);
    setSuggestions(top3);
  };

  const extractImageColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height).data;

    const matches: Color[] = [];

    for (let i = 0; i < imageData.length; i += 400 * 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      const distances = colorData.map((color) => ({
        color,
        dist: getDistance(r, g, b, color.R, color.G, color.B),
      }));
      distances.sort((a, b) => a.dist - b.dist);
      const bestMatch = distances[0].color;

      const isTooSimilar = matches.some(
        (existing) =>
          getDistance(
            existing.R,
            existing.G,
            existing.B,
            bestMatch.R,
            bestMatch.G,
            bestMatch.B
          ) < 50
      );

      if (!isTooSimilar) {
        matches.push(bestMatch);
      }

      if (matches.length >= 6) break; // optional: stop after 6 distinct matches
    }

    setAllMatches(matches);
  };

  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;

    findClosestColors(r, g, b);
  };

  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      extractImageColors();
    };
    img.src = image;
  }, [image]);

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: 200, marginBottom: 10 }}
      />
      <h2>Welcome to Sewing Market Color Finder</h2>
      <h2 style={{ marginBottom: 20 }}>
        مرحباً بكم في سوق الخياطة أداة البحث عن الألوان
      </h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: 20 }}
      />
      {image && (
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          style={{
            border: "1px solid #ccc",
            maxWidth: "100%",
            marginBottom: 30,
          }}
        />
      )}
      {mainMatch && (
        <div>
          <h2>🎯 Closest Color Found:</h2>
          <ColorBox color={mainMatch} />
        </div>
      )}
      {suggestions.length > 0 && (
        <div>
          <h3>🎨 Top 3 Suggestions:</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {suggestions.map((color, index) => (
              <ColorBox key={index} color={color} />
            ))}
          </div>
        </div>
      )}
      {allMatches.length > 0 && (
        <div>
          <h3>🧩 All Matched Colors from Image:</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {allMatches.map((color, index) => (
              <ColorBox key={index} color={color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorBox({ color }: { color: Color }) {
  return (
    <div
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
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: "bold" }}>{color.Code}</div>
        <div>{color.Name}</div>
        <div>{color.Hex}</div>
      </div>
    </div>
  );
}

export default App;
