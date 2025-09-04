'use client'

export default function WireframeLandscape() {
  return (
    <div className="wireframe-landscape">
      {/* Far Background Mountains */}
      <div className="wireframe-layer layer-far">
        <div className="mountain-range range-1">
          <div className="peak peak-1"></div>
          <div className="peak peak-2"></div>
          <div className="peak peak-3"></div>
        </div>
      </div>

      {/* Mid Background Mountains */}
      <div className="wireframe-layer layer-mid">
        <div className="mountain-range range-2">
          <div className="peak peak-4"></div>
          <div className="peak peak-5"></div>
          <div className="peak peak-6"></div>
          <div className="peak peak-7"></div>
        </div>
      </div>

      {/* Near Foreground Mountains */}
      <div className="wireframe-layer layer-near">
        <div className="mountain-range range-3">
          <div className="peak peak-8"></div>
          <div className="peak peak-9"></div>
        </div>
      </div>

      {/* Wireframe Grid Overlay */}
      <div className="wireframe-grid">
        <div className="grid-lines horizontal"></div>
        <div className="grid-lines vertical"></div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="float-element element-1"></div>
        <div className="float-element element-2"></div>
        <div className="float-element element-3"></div>
      </div>
    </div>
  )
}