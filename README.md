# KAIH 30 Hari — Habit Tracker + MongoDB

Aplikasi habit tracker 30 hari untuk siswa, sekarang memakai **backend Node.js + Express + MongoDB Atlas**.

- Siswa **wajib mengisi username + nama** sebelum bisa mengisi jurnal 30 hari.
- Setiap hari yang disimpan masuk ke koleksi `dailylogs` di MongoDB.
- Guru/admin bisa memantau seluruh siswa dan hasil KAIH lewat **dashboard admin**.
- Data tetap dicache di browser supaya aplikasi tidak blank saat offline; saat online, data disinkronkan ke server.

---

## 1. Struktur proyek

```
landingpage tracker/
├─ index.html               # aplikasi siswa
├─ admin.html               # dashboard admin (URL: /admin)
├─ css/
│  ├─ style.css             # gaya aplikasi siswa
│  └─ admin.css             # gaya dashboard admin
├─ js/
│  ├─ config.js             # konfigurasi kebiasaan & mood
│  ├─ storage.js            # cache localStorage
│  ├─ ui.js                 # toast, modal, ikon, helper
│  ├─ api.js                # klien REST API
│  ├─ buddy.js              # maskot
│  ├─ app.js                # logika tracker siswa
│  └─ admin.js              # logika dashboard admin
├─ server/
│  ├─ index.js              # entry point Express
│  ├─ db.js                 # koneksi MongoDB + seed admin
│  ├─ middleware/auth.js    # verifikasi JWT siswa/admin
│  ├─ models/               # Student, DailyLog, Admin
│  ├─ routes/               # studentAuth, student, admin
│  ├─ utils/                # serialisasi, agregasi, rate limit
│  └─ scripts/reset-admin.js
├─ .env                     # kredensial (JANGAN di-commit)
├─ .env.example
├─ package.json
└─ sw.js                    # service worker (API tidak di-cache)
```

---

## 2. Struktur database (MongoDB Atlas)

Database: **`kaih_tracker`** — 3 koleksi.

### Koleksi `students`

| Field          | Tipe     | Keterangan                                              |
| -------------- | -------- | ------------------------------------------------------- |
| `_id`          | ObjectId | ID siswa                                                |
| `username`     | String   | Unik, 3–30 karakter, huruf kecil/angka/`.` `_` `-`      |
| `name`         | String   | Nama siswa, 2–60 karakter                               |
| `studentClass` | String   | Kelas (opsional)                                        |
| `school`       | String   | Sekolah (opsional)                                      |
| `pinHash`      | String   | Hash bcrypt PIN 4–6 angka (tidak pernah dikirim ke klien) |
| `isActive`     | Boolean  | `false` = dinonaktifkan admin                           |
| `lastLoginAt`  | Date     | Login terakhir                                          |
| `createdAt`    | Date     | Waktu daftar                                            |
| `updatedAt`    | Date     | Update terakhir                                         |

Contoh dokumen:

```json
{
  "_id": { "$oid": "6750a1b2c3d4e5f6a7b8c9d0" },
  "username": "budi.sd5",
  "name": "Budi Santoso",
  "studentClass": "5A",
  "school": "SD Negeri 1",
  "pinHash": "$2a$10$...",
  "isActive": true,
  "lastLoginAt": "2026-11-27T02:14:00.000Z",
  "createdAt": "2026-11-26T09:00:00.000Z",
  "updatedAt": "2026-11-27T02:14:00.000Z"
}
```

### Koleksi `dailylogs`

Satu dokumen = satu hari milik satu siswa. Ada **unique index** `{ studentId, day }`.

| Field       | Tipe       | Keterangan                                  |
| ----------- | ---------- | ------------------------------------------- |
| `_id`       | ObjectId   | ID catatan                                  |
| `studentId` | ObjectId   | Referensi ke `students._id`                 |
| `day`       | Number     | 1–30                                        |
| `habits`    | Boolean[7] | Status 7 kebiasaan KAIH                     |
| `note`      | String     | Catatan harian, maks. 500 karakter          |
| `mood`      | String     | `""`, `"happy"`, `"okay"`, `"tired"`        |
| `createdAt` | Date       | Dibuat                                      |
| `updatedAt` | Date       | Disimpan/diubah terakhir                    |

Contoh dokumen:

```json
{
  "_id": { "$oid": "6750b2c3d4e5f6a7b8c9d0e1" },
  "studentId": { "$oid": "6750a1b2c3d4e5f6a7b8c9d0" },
  "day": 1,
  "habits": [true, true, false, true, true, false, true],
  "note": "Bangun pagi dan sholat tepat waktu.",
  "mood": "happy",
  "createdAt": "2026-11-26T09:05:00.000Z",
  "updatedAt": "2026-11-26T09:05:00.000Z"
}
```

### Koleksi `admins`

| Field          | Tipe     | Keterangan                        |
| -------------- | -------- | --------------------------------- |
| `_id`          | ObjectId | ID admin                          |
| `username`     | String   | Unik                              |
| `name`         | String   | Nama tampilan                     |
| `passwordHash` | String   | Hash bcrypt password              |
| `lastLoginAt`  | Date     | Login terakhir                    |
| `createdAt`    | Date     | Dibuat                            |

Admin awal dibuat otomatis dari `ADMIN_USERNAME` / `ADMIN_PASSWORD` di `.env` saat server pertama kali jalan.

---

## 3. Menjalankan

Prasyarat: **Node.js 18+** dan akses jaringan ke MongoDB Atlas.

```bash
npm install
npm start
```

Buka:

- Aplikasi siswa: <http://localhost:3000>
- Dashboard admin: <http://localhost:3000/admin>
- Health check: <http://localhost:3000/api/health>

Mode development (auto-restart):

```bash
npm run dev
```

Reset / ganti password admin:

```bash
npm run admin:reset
```

---

## 4. Konfigurasi `.env`

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb+srv://tegarwijayaa71_db_user:nDubfAJSydqjEkLE@cluster0.giciqak.mongodb.net/kaih_tracker?retryWrites=true&w=majority&compressors=zlib
MONGODB_DB=kaih_tracker

JWT_SECRET=ganti-dengan-string-acak-panjang-minimal-32-karakter
STUDENT_TOKEN_TTL=30d
ADMIN_TOKEN_TTL=12h

ADMIN_USERNAME=admin
ADMIN_PASSWORD=kaih-admin-2026
ADMIN_NAME=Administrator KAIH

CORS_ORIGIN=*
```

> Ganti `JWT_SECRET` dan `ADMIN_PASSWORD` sebelum dipakai sungguhan. File `.env` sudah masuk `.gitignore`.

---

## 5. Wajib: aktifkan Network Access di MongoDB Atlas

Kalau koneksi gagal (`MongooseServerSelectionError` / `Could not connect to any servers`), biasanya karena **IP allowlist** belum mengizinkan komputer/server kamu.

1. Buka <https://cloud.mongodb.com> → pilih project & cluster `cluster0`.
2. Menu **Security → Network Access**.
3. Klik **Add IP Address**.
4. Untuk development, pilih **Allow Access from Anywhere** (`0.0.0.0/0`).
   Untuk production, isi IP server yang dipakai saja.
5. Tunggu status berubah menjadi **Active** (± 1 menit), lalu jalankan ulang `npm start`.

Pastikan juga user database `tegarwijayaa71_db_user` ada di **Security → Database Access** dengan role **Read and write to any database** (atau minimal `readWrite` pada `kaih_tracker`).

---

## 6. Alur siswa

1. Buka aplikasi → tracker terkunci.
2. Klik **Isi Identitas** → isi username, nama, kelas/sekolah (opsional), dan PIN 4–6 angka.
3. Setelah tersimpan, tracker terbuka dan siswa bisa mengisi hari 1–30.
4. Setiap klik **Simpan Progres**:
   - data langsung disimpan ke MongoDB (`PUT /api/students/me/logs/:day`),
   - cache lokal diperbarui,
   - jika jaringan putus, data masuk antrean dan dikirim otomatis saat online.
5. Login ulang di perangkat lain memakai **username + PIN**.
6. **Hapus semua data** menghapus seluruh `dailylogs` siswa di server, tetapi akun tetap ada.

---

## 7. Dashboard admin

Fitur:

- Statistik: total siswa, siswa aktif hari ini, rata-rata konsistensi, total catatan.
- Daftar siswa + pencarian (nama/username/kelas/sekolah), pagination.
- Detail siswa: peta 30 hari, progres per kebiasaan, catatan harian.
- Aktifkan / nonaktifkan akun siswa.
- Hapus siswa beserta seluruh catatan hariannya.
- Unduh CSV seluruh siswa.

Login admin memakai kredensial dari `.env`.

---

## 8. Ringkasan REST API

| Method | Endpoint                          | Akses   | Fungsi                          |
| ------ | --------------------------------- | ------- | ------------------------------- |
| GET    | `/api/health`                     | publik  | Status server & database        |
| POST   | `/api/students/register`          | publik  | Daftar siswa (username+nama+PIN)|
| POST   | `/api/students/login`             | publik  | Login siswa                     |
| GET    | `/api/students/me`                | siswa   | Profil + semua log + statistik  |
| PATCH  | `/api/students/me`                | siswa   | Ubah nama/kelas/sekolah         |
| PUT    | `/api/students/me/logs/:day`      | siswa   | Simpan satu hari (1–30)         |
| DELETE | `/api/students/me/logs`           | siswa   | Hapus semua catatan siswa       |
| POST   | `/api/admin/login`                | publik  | Login admin                     |
| GET    | `/api/admin/stats`                | admin   | Statistik ringkas               |
| GET    | `/api/admin/students`             | admin   | Daftar siswa + pencarian        |
| GET    | `/api/admin/students/:id`         | admin   | Detail siswa + semua log        |
| PATCH  | `/api/admin/students/:id`         | admin   | Aktif/nonaktifkan siswa         |
| DELETE | `/api/admin/students/:id`         | admin   | Hapus siswa + log               |
| GET    | `/api/admin/export.csv`           | admin   | Unduh CSV siswa                 |

Autentikasi memakai header `Authorization: Bearer <token>`.

---

## 9. Deploy ke Vercel

Proyek ini sudah punya `api/index.js` + `vercel.json`, jadi bisa langsung di-deploy:

1. Push ke GitHub — **pastikan `.env` tidak ikut ke-commit** (sudah masuk `.gitignore`).
2. Di Vercel: **Add New → Project** → pilih repo → framework **Other** → Deploy.
3. **Project Settings → Environment Variables**, tambahkan kunci yang sama seperti di `.env`:
   - `MONGODB_URI`, `MONGODB_DB`
   - `JWT_SECRET` (minimal 16 karakter)
   - `STUDENT_TOKEN_TTL`, `ADMIN_TOKEN_TTL`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME`
   - `CORS_ORIGIN` (isi domain Vercel, atau `*` untuk development)
   Set untuk **Production**, lalu **Redeploy**.
4. MongoDB Atlas → **Network Access** → tambahkan **0.0.0.0/0**.
   Vercel serverless memakai IP keluar yang dinamis, jadi mengizinkan hanya IP laptop tidak cukup.
5. Buka `https://<nama-project>.vercel.app` dan `https://<nama-project>.vercel.app/admin`.

> **Catatan admin:** `ADMIN_PASSWORD` hanya dipakai saat admin pertama kali dibuat. Kalau database sudah punya admin dari lokal, password lama tetap berlaku. Samakan nilainya, atau jalankan `npm run admin:reset` dengan `MONGODB_URI` yang sama sebelum deploy. Mengganti `JWT_SECRET` akan membuat semua sesi lama logout.

Cara kerja di Vercel: file statis (`index.html`, `admin.html`, `css/`, `js/`, `sw.js`) dilayani langsung oleh Vercel, sedangkan `/api/*` dijalankan lewat serverless function `api/index.js`. Antrean offline tetap aman di `localStorage` browser.

Alternatif kalau ingin server Express berjalan terus (bukan serverless): deploy ke **Render / Railway / Fly.io** dengan command `npm start`. Di platform seperti itu IP keluar biasanya statis, jadi cukup mengizinkan IP tersebut di Atlas.

---

## 10. Catatan teknis

- PIN dan password admin di-hash dengan **bcrypt**, tidak pernah disimpan sebagai teks biasa.
- Token memakai **JWT**; token siswa disimpan di `localStorage` (`kaih_session_v1`).
- Service worker **tidak** meng-cache `/api/*`, jadi data selalu segar dari server.
- Semua input divalidasi ulang di server (username, nama, PIN, hari, panjang catatan).
- Rate limit sederhana melindungi endpoint login/register dari brute force.
- Folder `server/`, `node_modules/`, `.git/`, `.env`, dan `package.json` tidak disajikan sebagai file statis.
