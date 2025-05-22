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
    let allDistances: { color: Color; dist: number }[] = [];

    for (const color of colorData) {
      const dist = getDistance(r, g, b, color.R, color.G, color.B);
      allDistances.push({ color, dist });
    }

    allDistances.sort((a, b) => a.dist - b.dist);
    const [closest, ...rest] = allDistances.map((d) => d.color);
    setMainMatch(closest);
    setSuggestions(rest.slice(0, 3));
  };

  const handlePickColor = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;
    findClosestColors(r, g, b);
  };

  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let x = 0;
    let y = 0;

    if ("clientX" in e) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else if (e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    }

    handlePickColor(x, y);
  };

  const analyzeImageColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height).data;

    const sampled: { r: number; g: number; b: number }[] = [];
    for (let i = 0; i < imgData.length; i += 400 * 4) {
      sampled.push({
        r: imgData[i],
        g: imgData[i + 1],
        b: imgData[i + 2],
      });
    }

    const matchCounts: Record<string, { color: Color; count: number }> = {};

    for (const pixel of sampled) {
      let closest: Color | null = null;
      let minDist = Infinity;

      for (const color of colorData) {
        const dist = getDistance(
          pixel.r,
          pixel.g,
          pixel.b,
          color.R,
          color.G,
          color.B
        );
        if (dist < minDist) {
          minDist = dist;
          closest = color;
        }
      }

      if (closest) {
        if (!matchCounts[closest.Code]) {
          matchCounts[closest.Code] = { color: closest, count: 0 };
        }
        matchCounts[closest.Code].count++;
      }
    }

    const topMatches = Object.values(matchCounts)
      .sort((a, b) => b.count - a.count)
      .map((x) => x.color)
      .slice(0, 10); // Limit to top 10
    setAllMatches(topMatches);
  };

  useEffect(() => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      analyzeImageColors();
    };
    img.src = image;
  }, [image]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 30,
      }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        style={{
          width: "20%",
          maxWidth: 200,
          height: "auto",
          marginBottom: 10,
        }}
      />
      <h2 style={{ textAlign: "center" }}>
        Welcome to Sewing Market Color Finder
      </h2>
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>
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
            cursor: "crosshair",
            marginBottom: 30,
          }}
        />
      )}

      {mainMatch && (
        <div>
          <h2>🎯 Closest Color Found:</h2>
          <ColorCard color={mainMatch} />

          <h3>🎨 Top 3 Suggestions:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {suggestions.map((color, i) => (
              <ColorCard key={i} color={color} />
            ))}
          </div>
        </div>
      )}

      {allMatches.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>🌈 All Matched Colors from Image:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {allMatches.map((color, i) => (
              <ColorCard key={i} color={color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorCard({ color }: { color: Color }) {
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
      <div>
        <div style={{ fontWeight: "bold" }}>{color.Code}</div>
        <div>{color.Name}</div>
        <div>{color.Hex}</div>
      </div>
    </div>
  );
}

export default App;
