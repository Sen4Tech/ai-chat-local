# ✨ DeepSeek Chat Local

> A modern AI chat app built with **React + TypeScript + Vite**, featuring thread management, dark mode, and local persistence.

![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Dexie](https://img.shields.io/badge/IndexedDB-Dexie-8A2BE2)

---

## 🚀 Tentang Proyek

**DeepSeek Chat Local** adalah aplikasi chat AI dengan pengalaman UI yang clean dan interaktif:

- 🧠 Chat dengan model DeepSeek melalui endpoint API server-side
- 🗂️ Manajemen multi-thread (buat, pilih, hapus percakapan)
- 💾 Penyimpanan lokal di browser menggunakan IndexedDB (Dexie)
- 🌙 Light/Dark theme toggle
- ⚡ Responsif, modern, dan nyaman untuk penggunaan harian

---

## 🧩 Fitur Utama

- **Thread Sidebar**
  - Buat chat baru dengan judul kustom
  - Cari thread
  - Hapus thread dengan dialog konfirmasi

- **Chat Experience**
  - Input otomatis resize
  - `Enter` untuk kirim, `Shift+Enter` untuk baris baru
  - Tombol stop saat proses generate berlangsung
  - Tombol “beautify prompt” agar input lebih rapi
  - Tombol cepat scroll ke pesan terbaru

- **Data Layer**
  - Semua pesan & thread tersimpan lokal (IndexedDB)
  - Metadata waktu dibuat & diperbarui

---

## 🏗️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling/UI:** Tailwind CSS, Radix UI, Lucide Icons
- **Local DB:** Dexie + dexie-react-hooks
- **API Runtime:** `@vercel/node`
- **LLM Provider:** DeepSeek Chat Completions API

---

## 📁 Struktur Proyek Singkat

```txt
src/
├── api/
│   └── chat.ts              # Endpoint server-side ke DeepSeek API
├── components/
│   ├── ChatSidebar.tsx      # Sidebar thread + search + delete
│   ├── ChatMessage.tsx      # Bubble pesan
│   ├── ThoughtMessage.tsx   # Bubble “thinking” (opsional)
│   └── ui/                  # Komponen UI reusable
├── lib/
│   └── dexie.ts             # Skema & operasi IndexedDB
├── pages/
│   └── ChatPage.tsx         # Halaman utama percakapan
└── App.tsx                  # Routing + layout utama
```

---

## ⚙️ Menjalankan Proyek

### 1) Install dependency

```bash
npm install
```

### 2) Jalankan mode development

```bash
npm run dev
```

### 3) Build production

```bash
npm run build
```

### 4) Preview hasil build

```bash
npm run preview
```

---

## 🔐 Konfigurasi Environment

Buat file `.env` dan isi variabel berikut:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
```

> Endpoint server ada di `src/api/chat.ts` dan membaca key dari `process.env.DEEPSEEK_API_KEY`.

---

## 🧪 Script NPM

- `npm run dev` → menjalankan Vite dev server
- `npm run build` → type-check + build produksi
- `npm run lint` → linting project
- `npm run preview` → preview hasil build

---

## 📌 Catatan

- Data chat disimpan **lokal di browser** (IndexedDB), bukan di server database.
- Jika ingin deploy, pastikan environment variable `DEEPSEEK_API_KEY` tersedia di platform hosting Anda.

---

## 🤝 Kontribusi

Pull request dan issue sangat terbuka! Jika ingin menambahkan fitur seperti:

- streaming token realtime,
- ekspor percakapan,
- sinkronisasi cloud,

silakan buat issue/PR 🚀

---

## 📄 Lisensi

Belum ditentukan. Tambahkan file `LICENSE` sesuai kebutuhan proyek Anda.
