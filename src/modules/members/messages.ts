export const MEMBER_MESSAGES = {
  ditambah: { tone: "success", text: "Pengguna berhasil ditambahkan." },
  "role-diubah": { tone: "success", text: "Role pengguna berhasil diubah." },
  dicabut: { tone: "success", text: "Akses pengguna berhasil dicabut." },
  "owner-terakhir": { tone: "error", text: "Toko harus memiliki minimal 1 owner." },
  "akun-sendiri": { tone: "error", text: "Anda tidak bisa mengubah akses akun sendiri." },
  "tidak-ditemukan": { tone: "error", text: "Pengguna tidak ditemukan di toko ini." },
} as const;

export type MemberMessageCode = keyof typeof MEMBER_MESSAGES;

export function getMemberMessage(code: string) {
  return Object.hasOwn(MEMBER_MESSAGES, code) ? MEMBER_MESSAGES[code as MemberMessageCode] : null;
}