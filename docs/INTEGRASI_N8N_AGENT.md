# Integrasi AI Agent n8n ke Dashboard PeatGuard

Dokumen ini menjelaskan cara menyambungkan dua workflow n8n ke dashboard:

| Workflow | Fungsi | Tampil di dashboard sebagai |
|---|---|---|
| **A. Chat Agent** (sudah dibuat) | Petugas bertanya, agent menjawab dari data Supabase | Tombol **"Tanya Asisten AI"** di pojok kanan bawah setiap halaman |
| **B. Agent Pemantau** (baru) | Berjalan terjadwal, menganalisis data, lalu menulis notifikasi + saran tindakan | Notifikasi di **ikon lonceng** dengan label **AI** (muncul realtime) |

```
           ┌──────────────── Dashboard ────────────────┐
Petugas ──►│  Widget chat ──POST──► n8n Chat Trigger    │  (A)
           │                         └► Guardrails → AI Agent → Supabase (baca)
           │                                                    │
           │  Lonceng ◄── Realtime ── tabel notifications ◄─────┘
           └───────────────────────────────▲───────────────┘
                                           │ insert (source='agent')
n8n Schedule (tiap 15 mnt) → AI Agent Pemantau (B)
```

---

## 1. Persiapan Supabase

Jalankan ulang `supabase/schema.sql` (aman dijalankan berulang). Skrip ini menambahkan dua kolom ke tabel
`notifications`:

- `source` — `'sistem'` (dari bridge) atau `'agent'` (dari n8n)
- `recommendation` — saran tindakan dari agent

Skrip yang sama juga membuat:

- tabel `agent_settings` — tombol on/off, cooldown, dan kuota (diubah dari halaman **/agent**);
- tabel `agent_runs` — catatan setiap panggilan AI (untuk kuota & kartu pemakaian);
- view `v_agent_usage` dan `v_agent_candidates` — ringkasan pemakaian & gerbang hemat token.

Pastikan juga view `v_sensor_latest`, `v_sensor_hourly`, dan `v_notif_recent` sudah dibuat.

---

## 2. Workflow A – Menyambungkan Chat Agent ke Dashboard

### 2.1 Pengaturan node "When chat message received"

| Pengaturan | Nilai |
|---|---|
| Make Chat Publicly Available | **Aktif** |
| Mode | **Embedded Chat** |
| Authentication | None (atau Basic Auth, lihat bagian Keamanan) |
| Options → Allowed Origins (CORS) | `https://dashboard-peat.amarmsd.my.id,http://localhost:5173` |
| Options → Response Mode | **When Last Node Finishes** |
| Streaming | **Nonaktif** (widget membaca satu jawaban JSON utuh) |

Aktifkan workflow (toggle **Active**), lalu salin **Chat URL** dari node tersebut.
Bentuknya seperti `https://<n8n-anda>/webhook/<id>/chat`.

### 2.2 Node "fail session"

Node ini harus mengeluarkan field **`output`** (String), karena widget membaca field tersebut:

```
Maaf, permintaan ini tidak dapat diproses oleh Asisten PeatGuard. Saya hanya membantu pemantauan dan
pencegahan kebakaran lahan gambut. Untuk keadaan darurat, hubungi BPBD atau Manggala Agni setempat.
```

### 2.3 Gerbang on/off chat (WAJIB agar tombol di halaman Agent berlaku)

Tombol **Chat Asisten** di halaman `/agent` hanya mengubah tabel `agent_settings`. Supaya benar-benar
menghemat token, workflow n8n harus membacanya **sebelum Guardrails** (Guardrails juga memakai token):

```
When chat message received
  → Supabase: Get  agent_settings  (Select Condition: id = 1)
  → IF {{ $json.chat_enabled }} is true
       ├─ true  → Guardrails → AI Agent → … (seperti sekarang)
       └─ false → Set: output = "Asisten AI sedang dinonaktifkan untuk menghemat kuota. Silakan cek
                                  halaman Peringatan atau hubungi admin."
```

Pada node Guardrails, pakai `{{ $('When chat message received').item.json.chatInput }}` sebagai teks yang
diperiksa, karena output node Supabase menggantikan item sebelumnya.

Opsional, untuk mengisi angka **Chat** di kartu *Pemakaian 24 Jam*: setelah AI Agent, tambahkan Supabase
*Create* ke tabel `agent_runs` dengan `kind = chat`.

### 2.4 Pengaturan dashboard

```bash
cp .env.example .env
# isi VITE_N8N_CHAT_URL dengan Chat URL dari langkah 2.1
npm run dev
```

Untuk Docker, URL harus diberikan saat build:

```bash
docker build --build-arg VITE_N8N_CHAT_URL=https://<n8n-anda>/webhook/<id>/chat -t peatguard-dashboard .
```

Widget mengirim permintaan berikut ke n8n (format standar Chat Trigger):

```json
{ "action": "sendMessage", "sessionId": "<uuid per tab browser>", "chatInput": "<pertanyaan>" }
```

dan membaca balasan dari field `output`. `sessionId` yang sama dipakai selama tab terbuka, sehingga
**Simple Memory** di n8n mengingat percakapan. Tombol **"Percakapan baru"** membuat sesi baru.

---

## 3. Workflow B – Agent Pemantau (notifikasi otomatis)

Buat workflow **baru** di n8n. Kuncinya: **AI hanya dipanggil jika view `v_agent_candidates` berisi baris.**
View ini sudah memperhitungkan tombol on/off, jeda (cooldown) per titik, eskalasi ke Kritis, dan kuota 24 jam.
Jika kosong, workflow berhenti dengan **0 token**.

```
Schedule Trigger (15 menit)
  → Supabase: Get Many  v_agent_candidates      ← gerbang hemat token
       (Settings → Always Output Data: NONAKTIF, sehingga workflow berhenti bila kosong)
  → Code: gabungkan kandidat jadi satu teks
  → AI Agent "Pemantau"  (+ tool tren_per_jam; + Structured Output Parser)
  → Supabase: Create row di agent_runs   (kind = monitor)   ← mencatat pemakaian/kuota
  → IF  perlu_notifikasi = true
      → Supabase: Create row di tabel notifications
```

Satu kali jalan = **satu** panggilan AI untuk semua kandidat sekaligus, bukan satu per titik.

### 3.1 Node Code (gabungkan kandidat)

```javascript
const rows = $input.all().map(i => i.json);
const ringkasan = rows.map(r =>
  `${r.sensor_id} (${r.name}): kelembapan ${r.kelembapan}%, pH ${r.ph}, suhu ${r.suhu}°C, ` +
  `status ${r.status}, notifikasi AI terakhir: ${r.status_notif_terakhir ?? 'belum ada'}`
).join('\n');
return [{ json: { ringkasan, sensor_ids: rows.map(r => r.sensor_id).join(',') } }];
```

### 3.2 AI Agent "Pemantau"

- **Chat Model**: Anthropic Chat Model, pilih model yang ringan/murah (temperature 0, max tokens ±600)
- **Tools**: `tren_per_jam` saja (cukup; lebih sedikit tool = lebih sedikit token)
- **Memory**: tidak perlu
- **Require Specific Output Format**: aktif → sambungkan **Structured Output Parser**
- **Prompt (User Message)**: `{{ $json.ringkasan }}`
- **System Message**:

```text
Kamu adalah Agent Pemantau PeatGuard. Kamu menerima kondisi terbaru semua titik pantau.
Tugasmu memutuskan apakah petugas perlu diberi notifikasi baru, dan jika ya, menulisnya.

Aturan status:
- KRITIS  : kelembapan < 40% ATAU suhu >= 35°C
- WASPADA : kelembapan 40–59,9% ATAU suhu 32–34,9°C ATAU pH < 3,2 / > 5,5
- AMAN    : selain itu

Langkah:
1. Jika semua titik AMAN → perlu_notifikasi = false.
2. Untuk titik WASPADA/KRITIS, panggil tren_per_jam untuk melihat apakah kondisinya memburuk.
3. Jeda antar-notifikasi sudah diatur sistem; titik yang kamu terima memang perlu dianalisis.
   Set perlu_notifikasi = false hanya jika data jelas tidak wajar (mis. kemungkinan sensor rusak).
4. Tulis SATU notifikasi untuk titik paling berisiko.

Rekomendasi tindakan (SOP Respons PeatGuard v1 – DRAF):
- WASPADA → pembasahan (sekat kanal/sumur bor), patroli lebih sering, cek lapangan,
            informasikan regu MPA/Manggala Agni.
- KRITIS  → segera cek lapangan untuk memastikan ada/tidaknya bara; laporkan ke Daops
            Manggala Agni dan BPBD; siapkan pemadaman awal sesuai SOP regu.
Jangan menetapkan status Siaga/Darurat resmi. Satu sensor bukan bukti kebakaran.

Tulis dalam Bahasa Indonesia, singkat:
- title   : maks. 60 karakter, mis. "Baleendah makin kering (Waspada)"
- message : 1–2 kalimat berisi angka dan tren
- recommendation : 1–3 tindakan, dipisah titik koma
```

### 3.3 Structured Output Parser (JSON Schema)

```json
{
  "type": "object",
  "properties": {
    "perlu_notifikasi": { "type": "boolean" },
    "sensor_id": { "type": "string", "enum": ["PG-001", "PG-002", "PG-003"] },
    "severity": { "type": "string", "enum": ["info", "warning", "critical"] },
    "title": { "type": "string" },
    "message": { "type": "string" },
    "recommendation": { "type": "string" }
  },
  "required": ["perlu_notifikasi"]
}
```

### 3.4 Catat pemakaian, lalu IF + Supabase Create

Nama node AI Agent di bawah diasumsikan **`AI Agent`**; sesuaikan bila berbeda.

**a. Supabase → Create** di tabel `agent_runs` (selalu dijalankan setelah AI dipanggil, agar kuota terhitung):

| Kolom | Nilai |
|---|---|
| kind | `monitor` |
| sensor_id | `{{ $('Code').item.json.sensor_ids }}` |

**b. IF**: `{{ $('AI Agent').item.json.output.perlu_notifikasi }}` is true

**c. Supabase → Create** di tabel `notifications`:

| Kolom | Nilai |
|---|---|
| sensor_id | `{{ $('AI Agent').item.json.output.sensor_id }}` |
| title | `{{ $('AI Agent').item.json.output.title }}` |
| message | `{{ $('AI Agent').item.json.output.message }}` |
| recommendation | `{{ $('AI Agent').item.json.output.recommendation }}` |
| severity | `{{ $('AI Agent').item.json.output.severity }}` |
| source | `agent` |
| is_read | `false` |

Begitu baris masuk, dashboard menerimanya lewat **Supabase Realtime**: titik merah muncul di lonceng, dan
notifikasi tampil dengan label **AI** beserta **Saran** tindakannya — tanpa perlu memuat ulang halaman.

---

## 4. Strategi hemat token

| Lapisan | Berlaku untuk | Cara kerja |
|---|---|---|
| Tombol on/off | Chat & Pemantau | Dicek n8n **sebelum** Guardrails/AI (bagian 2.3 & 3) |
| Aturan tanpa AI | Semua titik | Bridge tetap membuat peringatan Kritis tanpa AI (0 token) |
| Hanya saat berubah | Pemantau | `v_agent_candidates` menyaring titik yang sudah dilaporkan |
| Cooldown per titik | Pemantau | Default 60 menit, bisa diubah di halaman Agent |
| Eskalasi selalu lolos | Pemantau | Waspada → Kritis tetap dilaporkan walau masih cooldown |
| Kuota 24 jam | Pemantau | Dihitung dari `agent_runs`; bila habis, AI berhenti |
| Satu panggilan per jalan | Pemantau | Semua kandidat digabung dalam satu prompt |
| Guardrails ringkas | Chat | Matikan pemeriksaan LLM yang tidak perlu; pakai model ringan |

Untuk memantau biaya nyata, buka tab *Executions* n8n: setiap node model menampilkan jumlah token.

## 5. Cara menguji

1. **Chat**: buka dashboard → klik **Tanya Asisten AI** → pilih salah satu contoh pertanyaan.
   Jika muncul *"Gagal menghubungi agent"*, periksa: workflow aktif, Allowed Origins berisi domain dashboard,
   dan `VITE_N8N_CHAT_URL` benar.
2. **Notifikasi agent tanpa menunggu jadwal**: di Supabase SQL Editor jalankan

   ```sql
   insert into notifications (sensor_id, title, message, recommendation, severity, source)
   values ('PG-002', 'Uji: Baleendah makin kering', 'Kelembapan turun dari 52% ke 44% dalam 3 jam.',
           'Lakukan pembasahan sekat kanal; cek lapangan', 'warning', 'agent');
   ```

   Notifikasi harus langsung muncul di lonceng dengan label **AI**.
3. **Workflow B**: klik *Execute Workflow* di n8n, lalu periksa output node AI Agent dan tabel `notifications`.
4. **Tombol on/off**: matikan *Agent Pemantau Otomatis* di halaman `/agent`, jalankan workflow B → node
   `v_agent_candidates` harus kosong dan AI Agent tidak berjalan. Matikan *Chat Asisten* → tombol chat
   mengambang hilang, dan pesan ke Chat URL dibalas teks "sedang dinonaktifkan".

---

## 6. Keamanan

- Chat URL bersifat publik: siapa pun yang tahu URL-nya bisa memakai agent (dan biaya model). Pertimbangkan
  **Basic Auth** pada Chat Trigger + reverse proxy, atau batasi akses dashboard dengan login.
- Agent hanya diberi tool **baca** (Get/Get Many). Satu-satunya penulisan adalah node *Create* di workflow B,
  yang berjalan di server n8n, bukan dari browser.
- Kebijakan RLS saat ini masih mengizinkan siapa pun menulis ke tabel `notifications` (lihat bagian *Temuan*
  di dokumen teknis). Idealnya penulisan hanya lewat *service role* di n8n/bridge.
