export default function MatrixRainLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex gap-1 h-[60px] items-end">
        <div className="w-1.5 h-10 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall" />
        <div className="w-1.5 h-14 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:200ms]" />
        <div className="w-1.5 h-9 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:400ms]" />
        <div className="w-1.5 h-12 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:100ms]" />
        <div className="w-1.5 h-11 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:300ms]" />
        <div className="w-1.5 h-8 bg-gradient-to-b from-transparent via-white to-transparent rounded-sm animate-matrix-fall [animation-delay:500ms]" />
      </div>
    </div>
  )
}
