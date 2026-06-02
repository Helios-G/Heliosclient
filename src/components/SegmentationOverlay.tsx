import { useEffect, useRef } from "react";

interface Props {
  imageUrl: string;
  maskUrl: string;
  className?: string;
  // 마스크 위에 추가로 깔리는 알파 (0~1). 기본 1 — 마스크 PNG 의 자체 alpha 만 사용
  maskAlpha?: number;
}

/**
 * 원본 이미지와 segmentation 마스크를 단일 canvas 로 합성해 정렬 오차 없이 표시.
 * 두 개의 <img> 를 absolute 로 쌓는 방식은 컨테이너 크기/aspect-ratio 차이로
 * 마스크가 어긋나기 쉬워 canvas 합성 방식을 사용.
 */
export function SegmentationOverlay({ imageUrl, maskUrl, className, maskAlpha = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageUrl || !maskUrl || !canvasRef.current) return;

    let cancelled = false;
    const canvas = canvasRef.current;

    const draw = async () => {
      try {
        const original = new Image();
        original.src = imageUrl;
        await original.decode();

        const mask = new Image();
        mask.src = maskUrl;
        await mask.decode();

        if (cancelled) return;

        const w = original.naturalWidth || 1;
        const h = original.naturalHeight || 1;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(original, 0, 0, w, h);

        // 마스크는 작은 사이즈(예: 12x12, 256x256 등) 이므로 원본 dim 에 맞춰 stretch
        if (maskAlpha < 1) ctx.globalAlpha = maskAlpha;
        ctx.drawImage(mask, 0, 0, w, h);
        ctx.globalAlpha = 1;
      } catch (err) {
        console.warn("[SegmentationOverlay] draw 실패:", err);
      }
    };

    draw();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, maskUrl, maskAlpha]);

  return <canvas ref={canvasRef} className={className} />;
}
