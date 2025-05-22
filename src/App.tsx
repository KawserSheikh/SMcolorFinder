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
    const file = e.target.files && e.target.files[0];
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

  const getTopMatches = (r: number, g: number, b: number, count: number) => {
    return colorData
      .map((color) => ({
        color,
        dist: getDistance(r, g, b, color.R, color.G, color.B),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, count)
      .map((entry) => entry.color);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;
    const top4 = getTopMatches(r, g, b, 4);
    setMainMatch(top4[0]);
    setSuggestions(top4.slice(1));
  };

  const extractDistinctMainColors = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const sampled = new Set<string>();
    const matches: Color[] = [];

    for (let y = 0; y < height; y += 20) {
      for (let x = 0; x < width; x += 20) {
        const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
        const match = getTopMatches(r, g, b, 1)[0];
        const key = match.Hex;
        if (!sampled.has(key)) {
          sampled.add(key);
          matches.push(match);
        }
      }
    }

    setAllMatches(matches);
  };

  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      extractDistinctMainColors(canvas); // Auto extract colors
    };
    img.src = image;
  }, [image]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ width: 150, display: "flex", margin: "0 auto" }}
      />
      <h2>Welcome to Sewing Market Color Finder</h2>
      <h3>مرحباً بكم في سوق الخياطة أداة البحث عن الألوان</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ margin: "20px 0" }}
      />

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

      {mainMatch && (
        <div style={{ marginBottom: 30 }}>
          <h2>🎯 Closest Color Found:</h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: "1px solid #ccc",
              borderRadius: 5,
              padding: 10,
              maxWidth: 300,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: mainMatch.Hex,
                borderRadius: 5,
              }}
            />
            <div>
              <div style={{ fontWeight: "bold" }}>{mainMatch.Code}</div>
              <div>{mainMatch.Name}</div>
              <div>{mainMatch.Hex}</div>
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>🎨 Top 3 Suggestions:</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {suggestions.map((sug, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  padding: 10,
                  width: 250,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: sug.Hex,
                    borderRadius: 5,
                  }}
                />
                <div>
                  <div style={{ fontWeight: "bold" }}>{sug.Code}</div>
                  <div>{sug.Name}</div>
                  <div>{sug.Hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allMatches.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2>🌈 All Matched Colors from Image:</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {allMatches.map((color, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  padding: 10,
                  width: 220,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: color.Hex,
                    borderRadius: 5,
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
}

export default App;
