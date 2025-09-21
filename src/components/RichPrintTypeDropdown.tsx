"use client";

import { useState, useRef, useEffect } from "react";

interface PrintTypeOption {
  value: "tile" | "ornament";
  name: string;
  description: string;
  sizes?: Array<{
    value: "basecamp" | "ridgeline" | "summit";
    name: string;
    dimensions: string;
    price: string;
  }>;
}

interface RichPrintTypeDropdownProps {
  printType: "tile" | "ornament";
  tileSize: "basecamp" | "ridgeline" | "summit";
  onChange: (printType: "tile" | "ornament", tileSize?: "basecamp" | "ridgeline" | "summit") => void;
  disabled?: boolean;
}

const printTypeOptions: PrintTypeOption[] = [
  {
    value: "tile",
    name: "Route Tile",
    description: "Square display piece",
    sizes: [
      {
        value: "basecamp",
        name: "Basecamp",
        dimensions: "100mm × 100mm",
        price: "$20"
      },
      {
        value: "ridgeline", 
        name: "Ridgeline",
        dimensions: "155mm × 155mm",
        price: "$40"
      },
      {
        value: "summit",
        name: "Summit", 
        dimensions: "210mm × 210mm",
        price: "$60"
      }
    ]
  },
  {
    value: "ornament",
    name: "Ornament",
    description: "Circular hanging piece"
  }
];

export default function RichPrintTypeDropdown({
  printType,
  tileSize,
  onChange,
  disabled = false,
}: RichPrintTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = printTypeOptions.find(option => option.value === printType);
  const selectedSize = selectedOption?.sizes?.find(size => size.value === tileSize);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayText = () => {
    if (printType === "tile" && selectedSize) {
      return `${selectedOption?.name} - ${selectedSize.name}`;
    }
    return selectedOption?.name || "Select Print Type";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left bg-white border border-slate-300 rounded-lg shadow-sm flex items-center justify-between transition-all ${
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-summit-sage ring-1 ring-summit-sage"
            : "hover:border-slate-400 focus:border-summit-sage focus:ring-1 focus:ring-summit-sage"
        }`}
      >
        <span className="text-sm font-medium text-basalt">
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {printTypeOptions.map((option) => (
            <div key={option.value}>
              {/* Main option header */}
              <div
                onClick={() => {
                  if (option.value === "ornament") {
                    onChange(option.value);
                    setIsOpen(false);
                  } else if (option.value === "tile" && !option.sizes) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                className={`px-3 py-2 border-b border-slate-100 ${
                  option.value === "ornament" ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                }`}
              >
                <div className="font-medium text-basalt text-sm">
                  {option.name}
                </div>
                <div className="text-xs text-slate-600">
                  {option.description}
                </div>
              </div>

              {/* Tile sizes if applicable */}
              {option.value === "tile" && option.sizes && (
                <div className="pl-4">
                  {option.sizes.map((size) => (
                    <div
                      key={size.value}
                      onClick={() => {
                        onChange("tile", size.value);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-2 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0 ${
                        printType === "tile" && tileSize === size.value
                          ? "bg-summit-sage/10 text-summit-sage"
                          : "hover:bg-slate-50 text-basalt"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {size.name}
                          </div>
                          <div className="text-xs text-slate-600">
                            {size.dimensions}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-summit-sage">
                          {size.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}