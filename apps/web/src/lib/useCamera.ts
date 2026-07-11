import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "streaming" | "error" | "denied";

export type CameraOptions = {
  facingMode?: "environment" | "user";
  width?: number;
  height?: number;
};

export function useCamera(options: CameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">(
    options.facingMode ?? "environment",
  );

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const start = useCallback(
    async (nextFacing?: "environment" | "user") => {
      const useFacing = nextFacing ?? facing;
      setStatus("requesting");
      setError(null);
      try {
        stop();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: useFacing },
            width: { ideal: options.width ?? 1280 },
            height: { ideal: options.height ?? 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => undefined);
        }
        setFacing(useFacing);
        setStatus("streaming");
      } catch (e) {
        const err = e as DOMException;
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          setStatus("denied");
        } else {
          setStatus("error");
        }
        setError(err.message || "Unable to access camera.");
      }
    },
    [facing, options.width, options.height, stop],
  );

  const flip = useCallback(async () => {
    await start(facing === "environment" ? "user" : "environment");
  }, [facing, start]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, status, error, facing, start, stop, flip };
}
