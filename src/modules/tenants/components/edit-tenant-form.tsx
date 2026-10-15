"use client";

import { Loader2, MapPin } from "lucide-react";
import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateTenantAction, type UpdateTenantState } from "@/modules/tenants/actions";

type EditTenantFormProps = {
  slug: string;
  name: string;
  workStartTime: string;
  workEndTime: string;
  faceRequired: boolean;
  gpsRequired: boolean;
  gpsLat: string;
  gpsLng: string;
  gpsRadius: string;
};

export function EditTenantForm(props: EditTenantFormProps) {
  const { slug, name, workStartTime, workEndTime, faceRequired, gpsRequired, gpsLat, gpsLng, gpsRadius } = props;

  const initialState: UpdateTenantState = {
    error: null,
    fieldErrors: {},
    values: { name, workStartTime, workEndTime, faceRequired, gpsRequired, gpsLat, gpsLng, gpsRadius },
  };
  const [state, formAction, isPending] = useActionState(updateTenantAction, initialState);

  const [faceOn, setFaceOn] = useState(faceRequired);
  const [gpsOn, setGpsOn] = useState(gpsRequired);
  const [lat, setLat] = useState(gpsLat);
  const [lng, setLng] = useState(gpsLng);
  const [radius, setRadius] = useState(gpsRadius || "100");
  const [locating, setLocating] = useState(false);

  const notify = useEffectEvent((message: string) => toast.success(message));
  useEffect(() => {
    if (state.successMessage) notify(state.successMessage);
  }, [state]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung GPS.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Lokasi toko diisi dari posisi kamu sekarang.");
      },
      (error) => {
        console.warn("[EditTenantForm] gagal ambil lokasi", error);
        setLocating(false);
        const pesan =
          error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini (atau matikan extension pemblokir lokasi), lalu coba lagi."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Lokasi tidak tersedia. Pastikan GPS/Location device aktif."
              : "Permintaan lokasi timeout. Coba lagi.";
        toast.error(pesan);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="faceRequired" value={faceOn ? "on" : "off"} />
      <input type="hidden" name="gpsRequired" value={gpsOn ? "on" : "off"} />

      <FormField id="name" label="Nama toko" defaultValue={state.values.name} error={state.fieldErrors.name} required />
      <div className="space-y-1.5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="workStartTime"
            label="Jam masuk"
            type="time"
            defaultValue={state.values.workStartTime}
            error={state.fieldErrors.workStartTime}
            required
          />
          <FormField
            id="workEndTime"
            label="Jam pulang"
            type="time"
            defaultValue={state.values.workEndTime}
            error={state.fieldErrors.workEndTime}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">Absen setelah jam masuk dihitung Telat.</p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="faceRequiredToggle">Wajibkan verifikasi wajah</Label>
          <p className="text-sm text-muted-foreground">
            Kalau aktif, karyawan harus daftar wajah dulu & absen masuk lewat verifikasi muka.
          </p>
        </div>
        <Switch id="faceRequiredToggle" checked={faceOn} onCheckedChange={setFaceOn} />
      </div>

      <div className="grid gap-4 rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="gpsRequiredToggle">Wajibkan lokasi GPS saat absen</Label>
            <p className="text-sm text-muted-foreground">
              Kalau aktif, absen masuk ditolak jika karyawan di luar radius toko.
            </p>
          </div>
          <Switch id="gpsRequiredToggle" checked={gpsOn} onCheckedChange={setGpsOn} />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
          className="justify-self-start"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
          {locating ? "Mengambil lokasi..." : "Gunakan Lokasi Saya Sekarang"}
        </Button>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="gpsLat">Latitude</Label>
            <Input id="gpsLat" name="gpsLat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-6.402500" inputMode="decimal" />
            {state.fieldErrors.gpsLat ? <p className="text-sm text-destructive">{state.fieldErrors.gpsLat}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gpsLng">Longitude</Label>
            <Input id="gpsLng" name="gpsLng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.814500" inputMode="decimal" />
            {state.fieldErrors.gpsLng ? <p className="text-sm text-destructive">{state.fieldErrors.gpsLng}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gpsRadius">Radius (meter)</Label>
            <Input id="gpsRadius" name="gpsRadius" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="100" inputMode="numeric" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: berdiri di toko lalu klik &quot;Gunakan Lokasi Saya Sekarang&quot;, atau tempel koordinat dari Google Maps.
          Radius 100–200 m disarankan.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}