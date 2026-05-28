import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Brush, Eraser, RotateCcw } from "lucide-react";

interface MaskEditorProps {
  imageUrl: string;
  maskUrl?: string;
  onMaskChange: (maskUrl: string) => void;
}

type DrawMode = "draw" | "erase";

export function MaskEditor({ imageUrl, maskUrl, onMaskChange }: MaskEditorProps) {
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [mode, setMode] = useState<DrawMode>("draw");
  const [brushSize, setBrushSize] = useState(18);
  const [maskOpacity, setMaskOpacity] = useState(0.45);

  useEffect(() => {
    const canvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!maskUrl) return;

    const mask = new Image();
    mask.src = maskUrl;
    mask.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
      emitMask();
    };
  }, [maskUrl]);

  const emitMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    onMaskChange(canvas.toDataURL("image/png"));
  };

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const paint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = getPoint(event);

    ctx.save();
    ctx.globalCompositeOperation = mode === "draw" ? "source-over" : "destination-out";
    ctx.fillStyle = "rgba(14, 165, 233, 1)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    paint(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    paint(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    emitMask();
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    emitMask();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          onClick={() => setMode("draw")}
          className={mode === "draw" ? "bg-[#0f62fe] text-white hover:bg-[#0043ce]" : ""}
        >
          <Brush className="mr-2 h-4 w-4" /> 브러시
        </Button>
        <Button
          type="button"
          variant={mode === "erase" ? "default" : "outline"}
          onClick={() => setMode("erase")}
          className={mode === "erase" ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
        >
          <Eraser className="mr-2 h-4 w-4" /> 지우개
        </Button>
        <Button type="button" variant="outline" onClick={clearMask}>
          <RotateCcw className="mr-2 h-4 w-4" /> 초기화
        </Button>
        <div className="min-w-44 flex-1">
          <p className="mb-1 text-xs font-medium text-slate-500">브러시 {brushSize}px</p>
          <Slider value={[brushSize]} min={4} max={52} step={2} onValueChange={(value) => setBrushSize(value[0] ?? 18)} />
        </div>
        <div className="min-w-44 flex-1">
          <p className="mb-1 text-xs font-medium text-slate-500">마스크 투명도 {Math.round(maskOpacity * 100)}%</p>
          <Slider value={[maskOpacity]} min={0.15} max={0.85} step={0.05} onValueChange={(value) => setMaskOpacity(value[0] ?? 0.45)} />
        </div>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-950">
        <canvas ref={imageCanvasRef} width={512} height={512} className="absolute inset-0 h-full w-full" />
        <canvas
          ref={maskCanvasRef}
          width={512}
          height={512}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ opacity: maskOpacity }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}
