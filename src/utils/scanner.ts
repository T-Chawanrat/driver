type NativeDetector = { detect: (video: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type NativeDetectorClass = {
  new(options?: { formats?: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

// Decode at most ten frames per second, with only one decode in flight.
export async function createScanner(video: HTMLVideoElement, onResult: (value: string) => void) {
  const formats = ["code_128", "code_39", "ean_13", "ean_8", "qr_code"];
  const Native = (window as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  let detector: NativeDetector | undefined;
  if (Native) {
    try {
      const supported = Native.getSupportedFormats ? await Native.getSupportedFormats() : formats;
      if (formats.every((format) => supported.includes(format))) detector = new Native({ formats });
    } catch { /* Use the software decoder. */ }
  }
  let decode: () => Promise<string | undefined>;
  if (detector) {
    const nativeDetector = detector;
    decode = async () => (await nativeDetector.detect(video))[0]?.rawValue;
  } else {
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import("@zxing/browser"), import("@zxing/library"),
    ]);
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.QR_CODE]);
    const reader = new BrowserMultiFormatReader(hints);
    const canvas = document.createElement("canvas");
    decode = async () => {
      const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d", { willReadFrequently: true })?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return reader.decodeFromCanvas(canvas).getText();
    };
  }
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = async () => {
    if (stopped) return;
    if (!document.hidden && video.readyState >= 2 && video.videoWidth) {
      try {
        const value = (await decode())?.trim();
        if (!stopped && value) onResult(value);
      } catch { /* No readable code in this frame. */ }
    }
    if (!stopped) timer = setTimeout(() => void tick(), 100);
  };
  void tick();
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}

export async function openCamera(purpose: "scan" | "photo") {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("กรุณาเปิดผ่าน HTTPS เพื่อใช้งานกล้อง");
  return navigator.mediaDevices.getUserMedia({ audio: false, video: {
    facingMode: { ideal: "environment" },
    width: { ideal: purpose === "photo" ? 1920 : 1280 },
    height: { ideal: purpose === "photo" ? 1080 : 720 },
    frameRate: { ideal: purpose === "photo" ? 30 : 15, max: 30 },
  } });
}
