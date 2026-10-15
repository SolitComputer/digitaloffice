// Logika murni (tanpa "use client") supaya bisa dipakai server action juga.
export const FACE_MATCH_THRESHOLD = 0.5; // < 0.5 = wajah orang yang sama

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function isSameFace(a: number[], b: number[]): boolean {
  return euclideanDistance(a, b) < FACE_MATCH_THRESHOLD;
}