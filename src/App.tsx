import React, { useState, useRef } from "react";
import colorData from "./colorData";

const getDistance = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) => {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

const getTopMatches = (r: number, g: number, b: number, count = 4) => {
  return colorData
    .map((color) => {
      const distance = getDistance(r, g, b, color.R, color.G, color.B);
      return { ...color, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
};

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<{
    r: number;
    g: number;
    b: number;
    hex: string;
  } | null>(null);
  const [bestMatch, setBestMatch] = useState<any | null>(null);
  const [otherMatches, setOtherMatches] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageLoad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;
    const hex = rgbToHex(r, g, b);
    setPickedColor({ r, g, b, hex });
    const matches = getTopMatches(r, g, b, 4);
    setBestMatch(matches[0]);
    setOtherMatches(matches.slice(1));
  };

  return (
    <div className="p-4 font-sans max-w-xl mx-auto">
      {/* Logo and Welcome Note */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo.png"
          alt="Sewing Market Logo"
          className="w-1/2 max-w-xs md:max-w-sm lg:max-w-md h-auto mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-center">
          Welcome to Sewing Market Color Finder
        </h1>
      </div>

      {/* File Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mb-4"
      />

      {/* Canvas Preview */}
      {image && (
        <div>
          <img
            ref={imgRef}
            src={image}
            alt="Uploaded"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
            className="hidden"
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border max-w-full mb-4"
          />
        </div>
      )}

      {/* Picked Color */}
      {pickedColor && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold text-lg mb-2">🎯 Picked Color</h2>
          <div
            className="w-12 h-12 border"
            style={{ backgroundColor: pickedColor.hex }}
          ></div>
        </div>
      )}

      {/* Best Match */}
      {bestMatch && (
        <div className="mb-4 p-4 border rounded bg-green-50">
          <h2 className="font-semibold text-lg mb-2">✅ Best Match</h2>
          <div>
            <strong>Code:</strong> {bestMatch.Code}
          </div>
          <div>
            <strong>Name:</strong> {bestMatch.Name}
          </div>
          <div>
            <strong>Hex:</strong> {bestMatch.Hex}
          </div>
          <div
            className="w-10 h-10 mt-1 border"
            style={{ backgroundColor: bestMatch.Hex }}
          ></div>
        </div>
      )}

      {/* Other Matches */}
      {otherMatches.length > 0 && (
        <div className="p-4 border rounded bg-gray-100">
          <h2 className="font-semibold text-lg mb-2">🔹 Other Close Matches</h2>
          {otherMatches.map((color, index) => (
            <div key={index} className="mb-2 p-2 border rounded bg-white">
              <div>
                <strong>Code:</strong> {color.Code}
              </div>
              <div>
                <strong>Name:</strong> {color.Name}
              </div>
              <div>
                <strong>Hex:</strong> {color.Hex}
              </div>
              <div
                className="w-10 h-10 mt-1 border"
                style={{ backgroundColor: color.Hex }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
