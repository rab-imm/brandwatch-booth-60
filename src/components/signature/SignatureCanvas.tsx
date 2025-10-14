import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";

const compressSignature = (canvas: HTMLCanvasElement): string => {
  // Create a smaller canvas for compression
  const maxWidth = 400;
  const maxHeight = 200;
  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  
  const compressedCanvas = document.createElement('canvas');
  compressedCanvas.width = canvas.width * scale;
  compressedCanvas.height = canvas.height * scale;
  
  const ctx = compressedCanvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');
  
  // Set white background for JPEG
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, compressedCanvas.width, compressedCanvas.height);
  
  // Draw scaled signature
  ctx.drawImage(canvas, 0, 0, compressedCanvas.width, compressedCanvas.height);
  
  // Convert to JPEG with 0.7 quality (reduces size by ~70%)
  return compressedCanvas.toDataURL('image/jpeg', 0.7);
};

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
  label?: string;
}

export const SignatureCanvas = ({ onSave, onCancel, label = "Draw your signature" }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing styles
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const signature = compressSignature(canvas);
    onSave(signature);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg bg-muted/20">
          <canvas
            ref={canvasRef}
            className="w-full h-48 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas} disabled={isEmpty}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isEmpty}>
              Save Signature
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
