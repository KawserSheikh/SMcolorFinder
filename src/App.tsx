import React, { useState, useRef, useEffect } from "react";
import colorData from "./colorData";

function getLabDistance(lab1: number[], lab2: number[]): number {
  return Math.sqrt(
    (lab1[0] - lab2[0]) ** 2 +
    (lab1[1] - lab2[1]) ** 2 +
    (lab1[2] - lab2[2]) ** 2
  );
}

function rgbToLab(r: number, g: number, b: number): number[] {
  function pivot(n: number): number {
    return n > 0.008856 ? Math.pow(n, 1 / 3) : (7.787 * n) + 16 / 116;
  }
  r /= 255;
  g /= 255;
  b /= 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  return [
    (116 * pivot(y)) - 16,
    500 * (pivot(x) - pivot(y)),
    200 * (pivot(y) - pivot(z))
  ];
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

  const findClosestColors = (r: number, g: number, b: number) => {
    const baseLab = rgbToLab(r, g, b);
    const distances = colorData.map((color) => ({
      color,
      dist: getLabDistance(baseLab, rgbToLab(color.R, color.G, color.B))
    }));
    distances.sort((a, b) => a.dist - b.dist);
    setMainMatch(distances[0].color);
    setSuggestions(distances.slice(1, 4).map(d => d.color));
  };

  const extractDominantColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const seen = new Set<string>();
    const clusters: { [key: string]: Color } = {};

    for (let i = 0; i < imageData.length; i += 80 * 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const key = `${r}-${g}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const baseLab = rgbToLab(r, g, b);
      const distances = colorData.map(color => ({
        color,
        dist: getLabDistance(baseLab, rgbToLab(color.R, color.G, color.B))
      })).sort((a, b) => a.dist - b.dist);
      const best = distances[0].color;
      clusters[best.Code] = best;
    }

    setAllMatches(Object.values(clusters));
  };

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

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
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
      extractDominantColors();
    };
    img.src = image;
  }, [image]);

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <img src="/logo.png" alt="Logo" style={{ width: 200, marginBottom: 10 }} />
      <h2>Welcome to Sewing Market Color Finder</h2>
      <h2 style={{ marginBottom: 20 }}>
        مرحباً بكم في سوق الخياطة أداة البحث عن الألوان
      </h2>
      <p style={{ fontWeight: 500, marginBottom: 10 }}>
        Upload image or Take a photo to find color
      </p>
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
          style={{ border: "1px solid #ccc", maxWidth: "100%", margin: "20px auto", display: "block" }}
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
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {suggestions.map((color, index) => (
              <ColorBox key={index} color={color} />
            ))}
          </div>
        </div>
      )}

      {allMatches.length > 0 && (
        <div>
          <h3>🧩 All Matched Colors from Image:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
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
        minWidth: 200
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 5,
          backgroundColor: color.Hex
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
