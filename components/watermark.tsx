"use client"

export function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <div 
        className="w-[500px] h-[200px] opacity-[0.04] dark:opacity-[0.03] bg-contain bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/images/medicalspin-logo.png')",
        }}
      />
    </div>
  )
}
