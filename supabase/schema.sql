-- ==============================================================================
-- SKEMA DATABASE SUPABASE: PEATGUARD (DETEKSI DINI KEBAKARAN LAHAN GAMBUT)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/piodzaormrizasbjnknn/sql
-- ==============================================================================

-- 1. Buat Tabel Titik Sensor (Master Data)
CREATE TABLE IF NOT EXISTS public.sensors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    last_moisture DOUBLE PRECISION DEFAULT 65.0,
    last_ph DOUBLE PRECISION DEFAULT 4.2,
    last_temperature DOUBLE PRECISION DEFAULT 28.5,
    status TEXT DEFAULT 'normal',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Buat Tabel Log Riwayat Telemetri Sensor (Time-Series Audit Trail)
CREATE TABLE IF NOT EXISTS public.sensor_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sensor_id TEXT REFERENCES public.sensors(id) ON DELETE CASCADE,
    sensor_name TEXT NOT NULL,
    moisture DOUBLE PRECISION NOT NULL,
    ph DOUBLE PRECISION NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT NOT NULL CHECK (status IN ('normal', 'warning', 'critical')),
    reason TEXT
);

-- Indeks performa query waktu dan ID sensor
CREATE INDEX IF NOT EXISTS idx_sensor_logs_created_at ON public.sensor_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_logs_sensor_id ON public.sensor_logs (sensor_id);

-- 3. Buat Tabel Notifikasi Peringatan Dini Karhutla
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sensor_id TEXT REFERENCES public.sensors(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- Kolom tambahan untuk notifikasi dari AI Agent (n8n). Aman dijalankan ulang.
--   source         : 'sistem' (bridge) atau 'agent' (AI Agent n8n)
--   recommendation : saran tindakan dari agent
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'sistem';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recommendation TEXT;

-- 4. Konfigurasi Keamanan Row Level Security (RLS) & Hak Akses
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Reset policy jika sudah pernah dibuat agar tidak error saat dieksekusi ulang
DROP POLICY IF EXISTS "Allow public read access for sensors" ON public.sensors;
CREATE POLICY "Allow public read access for sensors" ON public.sensors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access for sensor_logs" ON public.sensor_logs;
CREATE POLICY "Allow public read access for sensor_logs" ON public.sensor_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access for notifications" ON public.notifications;
CREATE POLICY "Allow public read access for notifications" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert for sensor_logs" ON public.sensor_logs;
CREATE POLICY "Allow public insert for sensor_logs" ON public.sensor_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update/upsert for sensors" ON public.sensors;
CREATE POLICY "Allow public update/upsert for sensors" ON public.sensors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert for notifications" ON public.notifications;
CREATE POLICY "Allow public insert for notifications" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update for notifications" ON public.notifications;
CREATE POLICY "Allow public update for notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Masukkan Data Awal (Seed) 3 Titik Pantau dengan Koordinat Nyata
INSERT INTO public.sensors (id, name, region, latitude, longitude, last_moisture, last_ph, last_temperature, status)
VALUES 
    ('PG-001', 'Parongpong', 'Parongpong, Bandung Barat', -6.8303, 107.5867, 0.0, 0.0, 0.0, 'normal'),
    ('PG-002', 'Baleendah', 'Baleendah, Kab. Bandung', -6.9982, 107.6324, 0.0, 0.0, 0.0, 'normal'),
    ('PG-003', 'Rancaupas', 'Rancaupas, Ciwidey', -7.1378, 107.3912, 0.0, 0.0, 0.0, 'normal')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    region = EXCLUDED.region,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- 6. Aktifkan Fitur Realtime Supabase (Idempoten)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==============================================================================
-- 7. PENGATURAN AI AGENT (ON/OFF & PENGHEMAT TOKEN)
--    Dibaca oleh workflow n8n SEBELUM memanggil model, dan diubah dari halaman /agent.
-- ==============================================================================

-- Satu baris pengaturan (id selalu 1)
CREATE TABLE IF NOT EXISTS public.agent_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    chat_enabled BOOLEAN NOT NULL DEFAULT TRUE,      -- chat asisten di dashboard
    monitor_enabled BOOLEAN NOT NULL DEFAULT FALSE,  -- agent pemantau terjadwal
    cooldown_minutes INT NOT NULL DEFAULT 60 CHECK (cooldown_minutes BETWEEN 5 AND 1440),
    daily_limit INT NOT NULL DEFAULT 30 CHECK (daily_limit BETWEEN 0 AND 1000),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
INSERT INTO public.agent_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Catatan setiap kali n8n benar-benar memanggil model (untuk kuota & pemantauan biaya)
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('chat', 'monitor')),
    sensor_id TEXT,
    tokens INT
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON public.agent_runs (created_at DESC);

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read agent_settings" ON public.agent_settings;
CREATE POLICY "Allow public read agent_settings" ON public.agent_settings FOR SELECT USING (true);
-- CATATAN KEAMANAN: sama seperti tabel lain, saat ini siapa pun dengan anon key dapat mengubah
-- pengaturan. Setelah dashboard memakai login (Supabase Auth), ganti `true` menjadi
-- `auth.role() = 'authenticated'`.
DROP POLICY IF EXISTS "Allow public update agent_settings" ON public.agent_settings;
CREATE POLICY "Allow public update agent_settings" ON public.agent_settings FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read agent_runs" ON public.agent_runs;
CREATE POLICY "Allow public read agent_runs" ON public.agent_runs FOR SELECT USING (true);
-- Penulisan agent_runs dilakukan n8n dengan service role key (melewati RLS), jadi tidak perlu policy INSERT publik.

-- Pemakaian 24 jam terakhir (ditampilkan di halaman /agent)
CREATE OR REPLACE VIEW public.v_agent_usage WITH (security_invoker = true) AS
SELECT
    COUNT(*) FILTER (WHERE kind = 'chat')    AS chat_24h,
    COUNT(*) FILTER (WHERE kind = 'monitor') AS monitor_24h,
    COALESCE(SUM(tokens), 0)                 AS tokens_24h
FROM public.agent_runs
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- GERBANG HEMAT TOKEN untuk agent pemantau.
-- Hanya mengembalikan titik yang PERLU dianalisis AI:
--   * agent pemantau aktif, dan kuota 24 jam belum habis;
--   * status titik waspada/kritis;
--   * belum ada notifikasi agent untuk titik itu selama masa cooldown,
--     KECUALI status naik dari waspada ke kritis (eskalasi selalu dilaporkan).
-- Jika view ini kosong, n8n berhenti tanpa memanggil model (0 token).
CREATE OR REPLACE VIEW public.v_agent_candidates WITH (security_invoker = true) AS
SELECT
    s.id AS sensor_id,
    s.name,
    s.last_moisture AS kelembapan,
    s.last_ph AS ph,
    s.last_temperature AS suhu,
    s.status,
    n.severity AS status_notif_terakhir,
    n.created_at AS waktu_notif_terakhir
FROM public.sensors s
CROSS JOIN public.agent_settings cfg
LEFT JOIN LATERAL (
    SELECT severity, created_at
    FROM public.notifications
    WHERE sensor_id = s.id AND source = 'agent'
    ORDER BY created_at DESC
    LIMIT 1
) n ON TRUE
WHERE cfg.monitor_enabled
  AND s.status IN ('warning', 'critical')
  AND (
        n.created_at IS NULL
     OR n.created_at < NOW() - MAKE_INTERVAL(mins => cfg.cooldown_minutes)
     OR (s.status = 'critical' AND n.severity <> 'critical')
  )
  AND (SELECT COUNT(*) FROM public.agent_runs r
       WHERE r.kind = 'monitor' AND r.created_at >= NOW() - INTERVAL '24 hours') < cfg.daily_limit;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
