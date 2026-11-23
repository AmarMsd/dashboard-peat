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

-- Publik hanya boleh MEMPERBARUI nilai terakhir sensor (dipakai bridge), bukan menambah/menghapus titik.
DROP POLICY IF EXISTS "Allow public update/upsert for sensors" ON public.sensors;
DROP POLICY IF EXISTS "Allow public update for sensors" ON public.sensors;
CREATE POLICY "Allow public update for sensors" ON public.sensors FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert for notifications" ON public.notifications;
CREATE POLICY "Allow public insert for notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Dashboard bersifat publik: status "dibaca" disimpan di browser masing-masing pengunjung,
-- jadi publik tidak perlu (dan tidak boleh) mengubah baris notifikasi.
DROP POLICY IF EXISTS "Allow public update for notifications" ON public.notifications;

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
    chat_daily_limit INT NOT NULL DEFAULT 200 CHECK (chat_daily_limit BETWEEN 0 AND 10000),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Untuk database yang sudah dibuat sebelum kolom ini ada
ALTER TABLE public.agent_settings ADD COLUMN IF NOT EXISTS chat_daily_limit INT NOT NULL DEFAULT 200
    CHECK (chat_daily_limit BETWEEN 0 AND 10000);
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
-- Publik TIDAK boleh mengubah pengaturan langsung. Perubahan hanya lewat fungsi
-- update_agent_settings() yang memeriksa PIN operator (lihat bagian 8).
DROP POLICY IF EXISTS "Allow public update agent_settings" ON public.agent_settings;

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

-- GERBANG CHAT PUBLIK: n8n membaca view ini SEBELUM Guardrails.
-- allowed = chat aktif DAN jumlah chat 24 jam terakhir belum melewati chat_daily_limit.
CREATE OR REPLACE VIEW public.v_chat_gate WITH (security_invoker = true) AS
SELECT
    cfg.chat_enabled,
    cfg.chat_daily_limit,
    u.chat_24h,
    (cfg.chat_enabled AND u.chat_24h < cfg.chat_daily_limit) AS allowed
FROM public.agent_settings cfg
CROSS JOIN LATERAL (
    SELECT COUNT(*) AS chat_24h FROM public.agent_runs
    WHERE kind = 'chat' AND created_at >= NOW() - INTERVAL '24 hours'
) u
WHERE cfg.id = 1;

-- ==============================================================================
-- 8. PIN OPERATOR (tanpa login)
--    Dashboard ini publik. Pengaturan AI hanya bisa diubah oleh operator yang tahu PIN.
--    PIN disimpan sebagai hash bersalt di tabel yang TIDAK bisa dibaca publik, dan
--    dicek di dalam database (bukan di browser). 5x salah -> terkunci 15 menit.
--
--    Atur / ganti PIN (jalankan di SQL Editor Supabase, BUKAN dari dashboard):
--      SELECT public.set_agent_admin_pin('ganti-dengan-pin-rahasia');
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agent_admin (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    pin_salt TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ
);
-- RLS aktif tanpa policy apa pun = tidak bisa dibaca/diubah lewat API publik.
ALTER TABLE public.agent_admin ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_agent_admin_pin(p_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_salt TEXT := md5(random()::text || clock_timestamp()::text);
BEGIN
    IF p_pin IS NULL OR length(p_pin) < 6 THEN
        RAISE EXCEPTION 'PIN minimal 6 karakter';
    END IF;
    INSERT INTO public.agent_admin (id, pin_salt, pin_hash)
    VALUES (1, v_salt, encode(sha256(convert_to(v_salt || p_pin, 'UTF8')), 'hex'))
    ON CONFLICT (id) DO UPDATE
        SET pin_salt = EXCLUDED.pin_salt, pin_hash = EXCLUDED.pin_hash,
            failed_attempts = 0, locked_until = NULL;
END $$;

-- Hasil: 'ok' | 'invalid' | 'locked' | 'not_set'. Tidak melempar error, agar hitungan
-- percobaan gagal tetap tersimpan.
CREATE OR REPLACE FUNCTION public.check_agent_admin_pin(p_pin TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    a public.agent_admin%ROWTYPE;
BEGIN
    SELECT * INTO a FROM public.agent_admin WHERE id = 1 FOR UPDATE;
    IF NOT FOUND THEN
        RETURN 'not_set';
    END IF;
    IF a.locked_until IS NOT NULL AND a.locked_until > NOW() THEN
        RETURN 'locked';
    END IF;
    IF a.locked_until IS NOT NULL THEN
        a.failed_attempts := 0; -- masa kunci sudah lewat
    END IF;
    IF p_pin IS NOT NULL AND encode(sha256(convert_to(a.pin_salt || p_pin, 'UTF8')), 'hex') = a.pin_hash THEN
        UPDATE public.agent_admin SET failed_attempts = 0, locked_until = NULL WHERE id = 1;
        RETURN 'ok';
    END IF;
    UPDATE public.agent_admin
       SET failed_attempts = a.failed_attempts + 1,
           locked_until = CASE WHEN a.failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE NULL END
     WHERE id = 1;
    RETURN CASE WHEN a.failed_attempts + 1 >= 5 THEN 'locked' ELSE 'invalid' END;
END $$;

-- Dipanggil dashboard: supabase.rpc('update_agent_settings', { p_pin, p_patch }).
-- p_patch = {} hanya memeriksa PIN (dipakai untuk "masuk operator").
CREATE OR REPLACE FUNCTION public.update_agent_settings(p_pin TEXT, p_patch JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_check TEXT;
    v_row public.agent_settings%ROWTYPE;
BEGIN
    v_check := public.check_agent_admin_pin(p_pin);
    IF v_check <> 'ok' THEN
        RETURN jsonb_build_object('ok', false, 'reason', v_check);
    END IF;

    IF p_patch IS NOT NULL AND p_patch <> '{}'::jsonb THEN
        UPDATE public.agent_settings SET
            chat_enabled     = COALESCE((p_patch->>'chat_enabled')::BOOLEAN, chat_enabled),
            monitor_enabled  = COALESCE((p_patch->>'monitor_enabled')::BOOLEAN, monitor_enabled),
            cooldown_minutes = COALESCE((p_patch->>'cooldown_minutes')::INT, cooldown_minutes),
            daily_limit      = COALESCE((p_patch->>'daily_limit')::INT, daily_limit),
            chat_daily_limit = COALESCE((p_patch->>'chat_daily_limit')::INT, chat_daily_limit),
            updated_at       = NOW()
        WHERE id = 1;
    END IF;

    SELECT * INTO v_row FROM public.agent_settings WHERE id = 1;
    RETURN jsonb_build_object('ok', true, 'settings', to_jsonb(v_row));
END $$;

-- Hak eksekusi: publik hanya boleh memanggil update_agent_settings (yang memeriksa PIN).
REVOKE ALL ON FUNCTION public.set_agent_admin_pin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_agent_admin_pin(TEXT) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.set_agent_admin_pin(TEXT) FROM anon, authenticated;
    REVOKE ALL ON FUNCTION public.check_agent_admin_pin(TEXT) FROM anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.update_agent_settings(TEXT, JSONB) TO anon, authenticated;
  END IF;
END $$;
