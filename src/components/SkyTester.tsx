"use client";

import { useState } from "react";

type SkyState =
  | "dawn"
  | "morning"
  | "day"
  | "afternoon"
  | "sunset"
  | "twilight"
  | "night";

const skyGradients = {
  dawn: "linear-gradient(135deg, #ff9a8b 0%, #a8e6cf 25%, #ffd3a5 50%, #fd9853 100%)",
  morning: "linear-gradient(135deg, #83a4d4 0%, #b6fbff 50%, #ffffff 100%)",
  day: "linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #ffffff 100%)",
  afternoon: "linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #ffffff 100%)",
  sunset:
    "linear-gradient(135deg, #fa709a 0%, #fee140 25%, #ff6b6b 50%, #4ecdc4 100%)",
  twilight:
    "linear-gradient(135deg, #667db6 0%, #0082c8 25%, #667db6 50%, #0082c8 100%)",
  night:
    "linear-gradient(135deg, #2c3e50 0%, #34495e 25%, #2c3e50 50%, #34495e 100%)",
};

const skyOpacities = {
  dawn: 0.3,
  morning: 0.25,
  day: 0.2,
  afternoon: 0.25,
  sunset: 0.35,
  twilight: 0.4,
  night: 0.5,
};

const textOverlays = {
  dawn: "rgba(247, 249, 247, 0.85)",
  morning: "rgba(247, 249, 247, 0.8)",
  day: "rgba(247, 249, 247, 0.75)",
  afternoon: "rgba(247, 249, 247, 0.8)",
  sunset: "rgba(247, 249, 247, 0.85)",
  twilight: "rgba(247, 249, 247, 0.9)",
  night: "rgba(247, 249, 247, 0.9)",
};

export default function SkyTester() {
  const [currentSky, setCurrentSky] = useState<SkyState>("day");

  return (
    <>
      {/* Sky Background - Behind everything */}
      <div
        className="fixed inset-0 -z-30 transition-all duration-[3s] ease-in-out"
        style={{
          background: skyGradients[currentSky],
        }}
      />

      {/* Wireframe Mountain Layer - In front of sky */}
      <div
        className="fixed inset-0 -z-20 transition-opacity duration-[3s] ease-in-out"
        style={{
          backgroundImage: 'url("/wireframe-timp-transparent.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Text Readability Overlay - Light overlay for content readability */}
      <div
        className="fixed inset-0 -z-10 transition-all duration-[3s] ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${textOverlays[currentSky]} 0%, ${textOverlays[currentSky]} 50%, transparent 100%)`,
        }}
      />

      {/* Sky Controls */}
      <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 z-50">
        <h3 className="text-white font-body font-semibold mb-3">Sky Tester</h3>
        <div className="grid grid-cols-4 gap-2">
          {Object.keys(skyGradients).map((sky) => (
            <button
              key={sky}
              onClick={() => setCurrentSky(sky as SkyState)}
              className={`px-3 py-2 rounded text-xs font-body transition-all duration-200 ${
                currentSky === sky
                  ? "bg-white text-black font-semibold"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {sky}
            </button>
          ))}
        </div>
        <div className="mt-3 text-white text-xs font-body">
          Current: <span className="font-semibold">{currentSky}</span>
        </div>
      </div>
    </>
  );
}
