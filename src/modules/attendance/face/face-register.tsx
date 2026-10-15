"use client";

import { Camera, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { registerFaceAction } from "./actions";
import { getFaceDescriptor, loadFaceModels } from "./face-api";

type FaceRegisterProps = {
  slug: string;
  alreadyRegistered: boolean;
};

export function FaceRegister({ slug, alreadyRegistered }: FaceRegisterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [registered, setRegistered] = useState(alreadyRegistered);
  const [pending, startTransition] = useTransition();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCamState("loading");
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamState("ready");
    } catch (error) {
      console.error("[FaceRegister] gagal akses kamera", error);
      setCamState("error");
      toast.error("Tidak bisa mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    startTransition(async () => {
      const descriptor = await getFaceDescriptor(video);
      if (!descriptor) {
        toast.error("Wajah tidak terdeteksi. Hadapkan wajah ke kamera & pastikan cukup cahaya.");
        return;
      }

      const result = await registerFaceAction(slug, Array.from(descriptor));
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Wajah berhasil didaftarkan.");
      setRegistered(true);
      stopCamera();
      setCamState("idle");
    });
  }, [slug, stopCamera]);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Registrasi Wajah</h3>
          <p className="text-sm text-muted-foreground">
            {registered
              ? "Wajah kamu sudah terdaftar. Daftar ulang kalau wajahmu berubah."
              : "Daftarkan wajahmu dulu agar bisa absen dengan verifikasi muka."}
          </p>
        </div>
        {registered ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            Terdaftar
          </span>
        ) : null}
      </div>

      <div className={camState === "ready" ? "overflow-hidden rounded-lg border bg-black" : "hidden"}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} playsInline muted autoPlay className="aspect-video w-full object-cover" />
      </div>

      <div className="flex flex-wrap gap-2">
        {camState !== "ready" ? (
          <Button
            type="button"
            onClick={startCamera}
            disabled={camState === "loading"}
            variant={registered ? "outline" : "default"}
          >
            {camState === "loading" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : registered ? (
              <RefreshCw className="size-4" />
            ) : (
              <Camera className="size-4" />
            )}
            {camState === "loading"
              ? "Memuat model..."
              : registered
                ? "Daftar Ulang Wajah"
                : "Mulai Daftar Wajah"}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={handleCapture} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {pending ? "Menyimpan..." : "Ambil & Simpan"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                stopCamera();
                setCamState("idle");
              }}
            >
              Batal
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}