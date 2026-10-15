"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { Camera, Loader2, LogIn, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import type { AttendanceStatus } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clockInAction, clockOutAction, type AttendanceActionState } from "@/modules/attendance/actions";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_VARIANTS } from "@/modules/attendance/status-meta";
import { formatClock } from "@/modules/attendance/time";
import { getFaceDescriptor, loadFaceModels } from "@/modules/attendance/face/face-api";

const initial: AttendanceActionState = { error: null };

type ClockCardProps = {
  slug: string;
  status: AttendanceStatus | null;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  faceRegistered: boolean;
  gpsRequired: boolean;
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("no-geo"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
}

export function ClockCard({ slug, status, checkInAt, checkOutAt, faceRegistered, gpsRequired }: ClockCardProps) {
  const [inState, clockIn, inPending] = useActionState(clockInAction, initial);
  const [outState, clockOut, outPending] = useActionState(clockOutAction, initial);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<"idle" | "loading" | "ready">("idle");
  const [busyTx, startTx] = useTransition();

  const notify = useEffectEvent((s: AttendanceActionState) => {
    if (s.successMessage) toast.success(s.successMessage);
    else if (s.error) toast.error(s.error);
  });
  useEffect(() => { notify(inState); }, [inState]);
  useEffect(() => { notify(outState); }, [outState]);

  const hasIn = Boolean(checkInAt);
  const hasOut = Boolean(checkOutAt);
  const nonWorking = status === "IZIN" || status === "SAKIT" || status === "LIBUR" || status === "ALPHA";

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamState("idle");
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // "in" kalau belum absen masuk, "out" kalau sudah masuk & belum pulang.
  const dispatch = useCallback(
    (fd: FormData) => {
      if (!hasIn) clockIn(fd);
      else clockOut(fd);
    },
    [hasIn, clockIn, clockOut],
  );

  const resolvePosition = useCallback(async (): Promise<GeolocationPosition | null | "skip"> => {
    if (!gpsRequired) return "skip";
    try {
      return await getPosition();
    } catch {
      toast.error("Lokasi gagal diambil. Aktifkan izin lokasi (atau GPS HP) lalu coba lagi.");
      return null;
    }
  }, [gpsRequired]);

  function appendPos(fd: FormData, pos: GeolocationPosition | null | "skip") {
    if (pos && pos !== "skip") {
      fd.set("lat", String(pos.coords.latitude));
      fd.set("lng", String(pos.coords.longitude));
      fd.set("acc", String(pos.coords.accuracy));
    }
  }

  const openCamera = useCallback(async () => {
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
      console.error("[ClockCard] gagal akses kamera", error);
      stopCamera();
      toast.error("Tidak bisa mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }, [stopCamera]);

  const verifyAndSubmit = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    startTx(async () => {
      const descriptor = await getFaceDescriptor(video);
      if (!descriptor) {
        toast.error("Wajah tidak terdeteksi. Hadapkan wajah ke kamera & pastikan cukup cahaya.");
        return;
      }
      const pos = await resolvePosition();
      if (pos === null) return;
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("faceDescriptor", JSON.stringify(Array.from(descriptor)));
      appendPos(fd, pos);
      stopCamera();
      dispatch(fd);
    });
  }, [slug, dispatch, stopCamera, resolvePosition]);

  const plainSubmit = useCallback(() => {
    startTx(async () => {
      const pos = await resolvePosition();
      if (pos === null) return;
      const fd = new FormData();
      fd.set("slug", slug);
      appendPos(fd, pos);
      dispatch(fd);
    });
  }, [slug, dispatch, resolvePosition]);

  const busy = inPending || outPending || busyTx;

  const mainLabel = camState === "loading"
    ? "Memuat kamera..."
    : busy
      ? "Memproses..."
      : hasIn
        ? faceRegistered ? "Absen Pulang (Verifikasi Wajah)" : "Absen Pulang"
        : faceRegistered ? "Absen Masuk (Verifikasi Wajah)" : "Absen Masuk";

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Absensi hari ini</p>
          {status ? (
            <Badge variant={ATTENDANCE_STATUS_VARIANTS[status]}>{ATTENDANCE_STATUS_LABELS[status]}</Badge>
          ) : (
            <p className="text-lg font-semibold">Belum absen</p>
          )}
          <p className="text-sm text-muted-foreground">
            Masuk {formatClock(checkInAt)} · Pulang {formatClock(checkOutAt)}
          </p>
        </div>

        <div className="flex gap-2">
          {nonWorking ? (
            <span className="text-sm text-muted-foreground">Status diatur oleh admin.</span>
          ) : !hasOut ? (
            <Button
              type="button"
              variant={hasIn ? "outline" : "default"}
              disabled={busy || camState !== "idle"}
              onClick={faceRegistered ? openCamera : plainSubmit}
            >
              {busy || camState === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : hasIn ? (
                <LogOut className="size-4" />
              ) : (
                <LogIn className="size-4" />
              )}
              {mainLabel}
            </Button>
          ) : (
            <Badge variant="secondary">Selesai hari ini</Badge>
          )}
        </div>
      </div>

      {/* Kamera verifikasi wajah — untuk absen masuk & pulang */}
      {!hasOut && !nonWorking && faceRegistered ? (
        <div className={camState === "ready" ? "mt-4 flex flex-col gap-3" : "hidden"}>
          <div className="overflow-hidden rounded-lg border bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} playsInline muted autoPlay className="aspect-video w-full object-cover" />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={verifyAndSubmit} disabled={busyTx}>
              {busyTx ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {busyTx ? "Memverifikasi..." : hasIn ? "Verifikasi & Pulang" : "Verifikasi & Masuk"}
            </Button>
            <Button type="button" variant="ghost" onClick={stopCamera} disabled={busyTx}>
              <X className="size-4" />
              Batal
            </Button>
          </div>
        </div>
      ) : null}

      {inState.error || outState.error ? (
        <p className="mt-3 text-sm text-destructive">{inState.error ?? outState.error}</p>
      ) : null}
    </Card>
  );
}