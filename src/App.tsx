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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setMainMatch(null);
      setSuggestions([]);
    };
    reader.readAsDataURL(file);
  };

  const findClosestColors = (r: number, g: number, b: number) => {
    let minDist = Infinity;
    let closest: Color | null = null;
    let allDistances: { color: Color; dist: number }[] = [];

    for (const color of colorData) {
      const dist = getDistance(r, g, b, color.R, color.G, color.B);
      allDistances.push({ color, dist });
      if (dist < minDist) {
        minDist = dist;
        closest = color;
      }
    }

    // Sort by distance ascending and take top 4 (including main closest)
    allDistances.sort((a, b) => a.dist - b.dist);
    const topSuggestions = allDistances
      .map(({ color }) => color)
      .filter((c) => c !== closest)
      .slice(0, 3);

    setMainMatch(closest);
    setSuggestions(topSuggestions);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;
    findClosestColors(r, g, b);
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
        style={{ width: 200, height: "auto", marginBottom: 10 }}
      />

      {/* Welcome Title */}
      <h2 style={{ marginBottom: 5, textAlign: "center" }}>
        Welcome to Sewing Market Color Finder
      </h2>
      <h2 style={{ marginBottom: 30, textAlign: "center" }}>
        مرحباً بكم في سوق الخياطة أداة البحث عن الألوان
      </h2>

      {/* File Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: 20 }}
      />

      {/* Canvas to show image and click to pick color */}
      {image && (
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            border: "1px solid #ccc",
            maxWidth: "100%",
            cursor: "crosshair",
            marginBottom: 30,
          }}
        />
      )}

      {/* Main closest color found */}
      {mainMatch && (
        <div
          style={{
            border: "2px solid black",
            padding: 15,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 15,
            backgroundColor: mainMatch.Hex,
            color: "#000",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: mainMatch.Hex,
              border: "1px solid #333",
            }}
          />
          <div>
            <h2>🎯 Closest Color Found:</h2>
            <p>
              <span>{mainMatch.Name} </span>
              <span style={{ fontWeight: "bold" }}>
                {mainMatch.Code}
              </span> - <span>{mainMatch.Hex}</span>
            </p>
          </div>
        </div>
      )}

      {/* Suggested top 3 closest matches */}
      {suggestions.length > 0 && (
        <div>
          <h3>Top 3 Suggestions:</h3>
          <div style={{ display: "flex", gap: 20 }}>
            {suggestions.map((color) => (
              <div
                key={color.Code}
                style={{
                  border: "2px solid black",
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: color.Hex,
                  color: "#000",
                  width: 120,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                title={`${color.Name} - ${color.Code}`}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: color.Hex,
                    margin: "0 auto 10px",
                    border: "1px solid #333",
                  }}
                />
                <div>
                  <div>{color.Name}</div>
                  <div style={{ fontWeight: "bold" }}>{color.Code}</div>
                  <div>{color.Hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
