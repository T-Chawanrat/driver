import { forwardRef, useCallback, useImperativeHandle, useRef, type PointerEvent } from "react";

export type SignaturePadHandle = {
  clear: () => void;
  toBlob: () => Promise<Blob | null>;
};

type SignaturePadProps = {
  onChange: (hasSignature: boolean) => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({ onChange }, ref) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const pointOf = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * event.currentTarget.width) / bounds.width,
      y: ((event.clientY - bounds.top) * event.currentTarget.height) / bounds.height,
    };
  };

  const clear = useCallback(() => {
    const element = canvas.current;
    element?.getContext("2d")?.clearRect(0, 0, element.width, element.height);
    drawing.current = false;
    onChange(false);
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    clear,
    toBlob: () => new Promise((resolve) => {
      const element = canvas.current;
      if (!element) {
        resolve(null);
        return;
      }
      element.toBlob(resolve, "image/png");
    }),
  }), [clear]);

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = pointOf(event);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.01, y + 0.01);
    context.stroke();
    drawing.current = true;
    onChange(true);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const { x, y } = pointOf(event);
    context.lineTo(x, y);
    context.stroke();
  };

  return (
    <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <canvas
        ref={canvas}
        width={900}
        height={400}
        aria-label="พื้นที่เซ็นลายเซ็นผู้รับ"
        className="block h-full w-full touch-none"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={() => { drawing.current = false; }}
        onPointerCancel={() => { drawing.current = false; }}
        onLostPointerCapture={() => { drawing.current = false; }}
      />
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
