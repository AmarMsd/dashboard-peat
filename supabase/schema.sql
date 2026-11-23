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
    ('PG-001', 'Titik Pantau 1', 'Stasiun 1 (Koordinat Telemetri)', -6.8303, 107.5867, 65.0, 4.2, 28.5, 'normal'),
    ('PG-002', 'Titik Pantau 2', 'Stasiun 2 (Koordinat Telemetri)', -6.8320, 107.5910, 41.8, 3.8, 33.7, 'warning'),
    ('PG-003', 'Titik Pantau 3', 'Stasiun 3 (Koordinat Telemetri)', -6.8285, 107.5815, 71.3, 4.6, 28.6, 'normal')
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
