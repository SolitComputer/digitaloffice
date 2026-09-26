# CLAUDE.md — DigitalOffice POS

## Project
Multi-tenant POS & Inventory platform. Satu platform, banyak toko (tenant), tiap toko terisolasi di `/toko/[slug]`.

Stack: Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · MariaDB 11.4 / MySQL · Drizzle ORM (`drizzle-orm/mysql2`) · Better Auth (cookie session + 2FA TOTP) · next-themes · sonner · lucide-react.

- DB client: `src/db/index.ts`
- Schema: `src/db/schema/*`
- Tenant guard: `requireTenant(slug)` di `@/modules/tenants/context`

## Commands
Package manager: **pnpm**. Dilarang pakai `npm` / `yarn` / `npx` (bikin lockfile campur). Pakai `pnpm` / `pnpm dlx`.

- `pnpm run dev` — dev server. JANGAN dijalankan oleh Claude, user sudah menjalankannya sendiri.
- `pnpm run lint` — ESLint
- `pnpm run typecheck` — `next typegen && tsc --noEmit`
- `pnpm run build` — WAJIB lolos sebelum bilang task selesai
- `pnpm run db:up` — nyalakan container MariaDB via Docker
- `pnpm run db:generate` — generate file migrasi Drizzle
- `pnpm run db:migrate` — jalankan migrasi ke database (WAJIB tanya dulu)
- `pnpm run db:seed` — seeding data awal (WAJIB tanya dulu)
- `pnpm add <pkg>` — install package (WAJIB tanya dulu)
- `pnpm dlx shadcn@latest add <nama>` — tambah komponen shadcn

## Workflow
1. Baca file terkait dulu sebelum edit. Jangan menebak isi file.
2. Task besar (modul baru, ubah schema): jelaskan rencana singkat dulu, tunggu OK.
3. Setelah edit: jalankan `pnpm run typecheck` + `pnpm run lint`, perbaiki semua error.
4. Perubahan minimal & fokus ke task. Jangan refactor yang tidak diminta.
5. Jangan hapus fitur yang sudah ada kecuali diminta.
6. Pertahankan struktur folder (`src/`, `src/modules/*`), pola komponen, dan desain UI yang sudah ada. Cari komponen/helper yang sudah ada sebelum membuat yang baru.

## Aturan Kritis — Multi-Tenant (JANGAN DILANGGAR)
- Kolom tenant bernama `tenant_id` (TypeScript: `tenantId`), tabel induk `tenants`. JANGAN pakai nama `store_id` / `storeId`.
- SETIAP query data toko WAJIB difilter `tenantId`. Tidak ada query tabel tenant tanpa filter tenant.
- `tenantId` selalu di-resolve di server dari `slug` URL + session user lewat `requireTenant(slug)`. JANGAN percaya `tenantId` dari body request / form / client.
- Setiap Server Action & Route Handler toko wajib urutan ini:
  1. Ambil session (Better Auth) → tidak ada = redirect `/login`
  2. Resolve tenant dari slug → tidak ada / suspended = tolak
  3. Cek membership user di tenant itu → tidak ada = redirect `/tanpa-akses`
  4. Cek permission spesifik aksi (lihat RBAC)
  5. Baru jalankan query
- Langkah di atas lewat `requireTenant` / helper guard yang sudah ada. Jangan tulis ulang logika auth di tiap file.
- Tenant berstatus suspended: blokir semua aksi tulis.
- Update / delete juga wajib `where` dengan `tenantId`, bukan hanya `id`.

## RBAC & Permission
- Role: `SUPER_ADMIN` (platform) > `OWNER` > `MANAGER` > `KASIR` > `STAFF`.
- Permission granular: `inventory.view`, `inventory.stock`, `inventory.manage`, `members.view`, `members.manage`.
- Cek berdasarkan PERMISSION, bukan nama role, supaya custom permission per user tetap jalan.
- Permission baru untuk modul baru (contoh: `pos.checkout`, `pos.void`, `cashflow.manage`, `attendance.manage`) harus ditambahkan di definisi permission pusat + default mapping per role.
- Validasi permission SELALU di server. Menyembunyikan tombol di UI hanya untuk UX, bukan keamanan.
- User tidak boleh mengubah role/permission dirinya sendiri atau user dengan role lebih tinggi.
- Rute `/admin` hanya untuk `SUPER_ADMIN`.

## Auth & Keamanan
- Auth hanya lewat Better Auth. Jangan buat sistem session sendiri.
- Jangan ubah alur login, 2FA (`/login/verifikasi`), rate limit, atau backup codes tanpa diminta eksplisit.
- Jangan pernah log / return password, secret TOTP, backup codes, atau token session.
- Jangan baca atau tampilkan isi `.env*`.

## Database — MariaDB / MySQL + Drizzle
- Ini BUKAN PostgreSQL. Pakai `drizzle-orm/mysql-core` (`mysqlTable`, `varchar`, `int`, `bigint`, `decimal`, `datetime`, `mysqlEnum`). DILARANG `pgTable`, `pgEnum`, `uuid()`, `serial()`, `jsonb`, atau sintaks khusus Postgres.
- Ikuti pola schema yang sudah ada di `src/db/schema/*` (tipe ID, nama kolom, timestamp, enum). Cek tabel yang mirip sebelum membuat tabel baru.
- MySQL tidak mendukung `.returning()`. Pakai `$returningId()` saat insert, atau query ulang setelahnya.
- Operasi multi-langkah pakai `db.transaction(async (tx) => { ... })` dan semua query di dalamnya pakai `tx`, bukan `db`.
- Update yang rawan race condition (stok, nomor nota, saldo kas) → kunci baris dengan `.for("update")` di dalam transaksi, atau update atomic (`sql\`stock = stock - ${qty}\``) + cek hasilnya.
- Tabel tenant baru wajib punya `tenant_id` (foreign key ke `tenants.id`) + index, `created_at`, `updated_at`.
- Index untuk kolom yang sering difilter: `tenant_id`, `sku`, `created_at`. Unique per tenant pakai composite index (`tenant_id`, `sku`).
- Perubahan schema: edit file schema → `pnpm run db:generate` → review file migrasi → `db:migrate` hanya setelah user setuju. Jangan edit file migrasi yang sudah pernah dijalankan.

## Code Style
- TypeScript strict. Dilarang `any`, pakai `unknown` + type guard atau tipe yang benar. Pakai tipe hasil inferensi Drizzle (`typeof table.$inferSelect`).
- `async/await`, bukan `.then()`.
- Validasi semua input Server Action dengan schema (zod), termasuk angka & enum.
- Early return, hindari nested if/else.
- Nama deskriptif: `getLowStockProducts`, bukan `getData`.
- Tidak ada kode dikomentari, tidak ada `console.log` tersisa.
- Jangan overengineer: buat abstraksi hanya jika dipakai 2+ tempat.
- Server Action return bentuk konsisten: `{ success: true, data } | { success: false, error: string }`.

## Kode Rapi
- Satu file satu tanggung jawab. Komponen > ~200 baris → pecah.
- Urutan import: React/Next → library → `@/components` → `@/modules` / `@/lib` / `@/db` → types → relatif.
- Logika bisnis di `src/modules/*` / server action, bukan di dalam komponen UI.
- Kode per fitur diletakkan di modulnya masing-masing (`src/modules/<fitur>`), ikuti pola modul yang sudah ada.
- Jangan definisikan ulang tipe yang sama di banyak file.
- Hapus import, variabel, dan file yang tidak terpakai setelah edit.
- Ikuti format Prettier/ESLint project. Jangan ubah format file yang tidak disentuh.

## Next.js 16 / React 19
- Server Component default. `"use client"` hanya untuk state, effect, event handler, browser API, letakkan serendah mungkin di tree.
- `params` dan `searchParams` di page/layout adalah Promise, wajib di-`await`.
- Fetch data di Server Component / Server Action, hindari fetch di `useEffect`.
- Mutasi via Server Action + `revalidatePath` untuk rute `/toko/[slug]/...` yang terdampak.
- Form pakai pola yang sudah ada di project (Server Action + `useActionState` / form library yang sudah dipakai). Jangan campur pola baru.
- Route dengan data async wajib punya `loading.tsx` + `error.tsx`.
- Hindari hydration mismatch: jangan `Date.now()`, `Math.random()`, `window`, atau format tanggal/locale saat render server tanpa timezone tetap. Tema pakai pola next-themes (cek `mounted`).

## Performa — Seringan Mungkin Tanpa Mengorbankan Fitur
Ringan bukan berarti mengurangi fitur, validasi, keamanan, atau loading/error state.
- Utamakan Server Component. Makin sedikit `"use client"`, makin kecil JS yang dikirim ke browser.
- Pisahkan bagian interaktif kecil ke client component sendiri. Jangan jadikan satu halaman penuh client.
- Jangan tambah dependency baru kalau bisa diselesaikan dengan kode singkat atau library yang sudah ada. Wajib tanya dulu sebelum install package.
- Query: select hanya kolom yang dipakai, wajib paginasi untuk list, hindari N+1 (pakai join / satu query).
- Jalankan query independen paralel dengan `Promise.all`.
- Komponen berat & jarang dipakai (chart, scanner barcode, dialog kompleks) → `next/dynamic`.
- Gambar pakai `next/image`.
- Pencarian/filter pakai debounce + search params URL, bukan fetch tiap ketikan.
- Jangan `useMemo` / `useCallback` di mana-mana. Pakai hanya kalau ada masalah performa nyata.
- Jangan duplikasi state yang bisa diturunkan dari props/data lain.

## UI / UX — shadcn First, Jangan Ngide
Urutan wajib sebelum membuat UI:
1. Cek komponen yang sudah ada di project (`src/components/ui`, `src/components`, `src/modules/*`). Kalau ada → PAKAI, jangan bikin versi baru.
2. Belum ada tapi tersedia di shadcn/ui → tambahkan via `pnpm dlx shadcn@latest add <nama>`. Jangan tulis ulang manual.
3. Tidak ada di shadcn → baru buat komponen sendiri, dari primitive shadcn yang sudah ada, dengan gaya yang sama.

Aturan tambahan:
- Ikuti pola halaman yang sudah ada (layout, spacing, header, tabel, form, dialog). Halaman baru harus terlihat seperti bagian dari app yang sama.
- Jangan menambah animasi, gradient, efek, ikon dekoratif, atau variasi layout yang tidak diminta.
- Jangan install library UI / ikon baru.
- Jangan edit isi file di `src/components/ui` kecuali diminta. Kustomisasi lewat `className` / wrapper.
- Responsif: sidebar untuk desktop, Sheet untuk mobile. Layar kasir harus nyaman di tablet.
- Feedback aksi pakai `sonner` toast (sukses & gagal). Pesan error untuk user dalam Bahasa Indonesia, jelas, tanpa detail teknis.
- Setiap list punya empty state, loading state, dan error state.

## Ikon — Dilarang Emoji
- DILARANG emoji di mana pun: UI, label, tombol, toast, placeholder, empty state, pesan error, komentar kode, commit message, dan jawaban chat.
- Semua ikon pakai `lucide-react` (bawaan shadcn). Import per ikon: `import { Package, Trash2 } from "lucide-react"`.
- Ukuran konsisten dengan pola yang ada, default `className="size-4"`. Warna ikut teks (`text-muted-foreground`, dll.), jangan hardcode.
- Tombol yang hanya berisi ikon wajib punya `aria-label` atau `<span className="sr-only">`.
- Ikon mengikuti arti yang sudah dipakai di app (misal: edit = `Pencil`, hapus = `Trash2`). Cek ikon yang sudah dipakai sebelum memilih yang baru.
- Logo toko / aplikasi pakai file gambar via `next/image` atau komponen logo yang sudah ada, bukan emoji atau teks pengganti.

## Tema — JANGAN DIUBAH (Tailwind v4)
- Tailwind v4: TIDAK ADA `tailwind.config.js`. Jangan membuatnya. Tema ada di `src/app/globals.css` (`@theme`, CSS variables).
- Dilarang mengubah `src/app/globals.css`, `components.json`, `postcss.config`, font, radius, dan konfigurasi next-themes.
- Wajib support dark & light mode: pakai token tema (`bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-muted`, `text-destructive`), jangan hardcode warna seperti `bg-white`, `text-black`, `bg-gray-100`, hex, atau `dark:` manual.
- Butuh warna status (sukses/peringatan)? Pakai variant komponen yang sudah ada (Badge, Alert). Kalau tidak ada, tanya dulu.

## Domain: Inventori & Stok
- Tipe mutasi: `IN`, `OUT`, `ADJUST`. Setiap perubahan stok WAJIB membuat baris stock movement (user, tanggal, catatan/alasan).
- Update stok + insert movement harus ATOMIC dalam satu `db.transaction`. Jangan dua query terpisah.
- Stok tidak boleh minus kecuali diizinkan eksplisit.
- Jangan pernah update kolom stok langsung tanpa movement.
- Produk tidak dihapus permanen jika punya riwayat → arsipkan.
- SKU unik per tenant (bukan global).

## Domain: Uang
- Simpan nominal sebagai integer rupiah (`int` / `bigint`) atau `decimal`, JANGAN `float` / `double`. Ikuti tipe yang sudah dipakai di schema.
- Format tampilan: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.
- Semua kalkulasi total/diskon/pajak dihitung ulang di SERVER. Jangan percaya total dari client.

## Domain: POS / Transaksi (modul berikutnya)
- Checkout dalam satu `db.transaction`: buat nota + item + stock movement `OUT` per item + catat pembayaran. Gagal satu, rollback semua.
- Simpan snapshot harga jual & harga modal per item di nota (harga produk bisa berubah nanti).
- Nomor nota unik per tenant, berurutan, aman dari race condition (counter per tenant + `.for("update")`).
- Nota yang sudah selesai tidak diedit: pembatalan lewat void/refund yang mengembalikan stok via movement `IN`.
- Metode pembayaran: Tunai, QRIS, Transfer, Kartu.

## Domain: Cashflow & Absensi (roadmap)
- Cashflow: setiap entri punya tipe (masuk/keluar), kategori, nominal, user, tanggal, catatan. Penjualan POS tunai tercatat otomatis, bukan input manual.
- Tutup shift: simpan kas sistem vs kas fisik + selisihnya.
- Absensi: clock-in/out pakai waktu SERVER, bukan waktu device. Satu clock-in aktif per user per tenant.
- Waktu disimpan UTC, ditampilkan di `Asia/Jakarta`.

## Format Jawaban
Selalu Bahasa Indonesia, tanpa emoji.
Saat debugging / edit kode, urutannya:
1. Root cause
2. Kenapa terjadi
3. Fix yang tepat
4. Before / after — hanya bagian yang berubah, sertakan path file + nomor line
5. Daftar file yang terdampak