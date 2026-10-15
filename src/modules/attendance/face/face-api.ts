"use client";

type FaceApi = typeof import("@vladmandic/face-api");

let faceapiPromise: Promise<FaceApi> | null = null;
let loaded = false;

async function getApi(): Promise<FaceApi> {
  if (!faceapiPromise) {
    // Dynamic import: library baru di-load di browser saat dipanggil, bukan saat SSR.
    faceapiPromise = import("@vladmandic/face-api");
  }
  return faceapiPromise;
}

export async function loadFaceModels(): Promise<void> {
  if (loaded) return;
  const faceapi = await getApi();
  const url = "/models";
  await faceapi.nets.tinyFaceDetector.loadFromUri(url);
  await faceapi.nets.faceLandmark68Net.loadFromUri(url);
  await faceapi.nets.faceRecognitionNet.loadFromUri(url);
  loaded = true;
}

export async function getFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
): Promise<Float32Array | null> {
  const faceapi = await getApi();
  const detection = await faceapi
    .detectSingleFace(
      input,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
}