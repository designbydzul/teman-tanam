-- Migration: Seed plant_phase_definitions table
-- Run this in Supabase Dashboard SQL Editor

-- First, add RLS policy to allow inserts (if not exists)
-- This is a reference table, all authenticated users can read
DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Allow public read access to plant_phase_definitions" ON plant_phase_definitions;
  DROP POLICY IF EXISTS "Allow authenticated read access to plant_phase_definitions" ON plant_phase_definitions;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create read policy for all users (this is reference data)
CREATE POLICY "Allow public read access to plant_phase_definitions"
  ON plant_phase_definitions
  FOR SELECT
  USING (true);

-- =============================================
-- Seed Phase Definitions
-- =============================================

-- Clear existing data first (in case of re-run)
DELETE FROM plant_phase_definitions;

-- Sayuran (Vegetables) - 5 phases
INSERT INTO plant_phase_definitions (category, phase_key, phase_name, phase_order, icon, color, description, care_tips) VALUES
('Sayuran', 'semai', 'Semai', 1, '🌱', '#8BC34A', 'Tahap awal pertumbuhan dari biji hingga muncul daun pertama.', ARRAY['Jaga kelembaban tanah, jangan sampai kering', 'Letakkan di tempat teduh dengan cahaya tidak langsung', 'Siram dengan spray halus agar biji tidak terganggu', 'Suhu ideal 20-25°C']),
('Sayuran', 'vegetatif', 'Vegetatif', 2, '🌿', '#4CAF50', 'Tahap pertumbuhan daun dan batang. Tanaman mulai membesar.', ARRAY['Pindahkan ke pot lebih besar jika akar sudah penuh', 'Mulai berikan pupuk nitrogen untuk pertumbuhan daun', 'Pastikan mendapat sinar matahari 6-8 jam', 'Siram secara teratur, pagi atau sore hari']),
('Sayuran', 'berbunga', 'Berbunga', 3, '🌸', '#E91E63', 'Tanaman mulai mengeluarkan bunga sebagai persiapan berbuah.', ARRAY['Kurangi pupuk nitrogen, tingkatkan fosfor dan kalium', 'Bantu penyerbukan dengan menggoyang tanaman lembut', 'Jaga kelembaban tanah tetap stabil', 'Hindari memindahkan tanaman saat berbunga']),
('Sayuran', 'berbuah', 'Berbuah', 4, '🍅', '#FF5722', 'Buah mulai terbentuk dan berkembang hingga siap panen.', ARRAY['Berikan pupuk kalium untuk kualitas buah', 'Pasang penyangga jika buah berat', 'Pangkas daun yang menghalangi buah dari sinar matahari', 'Siram teratur tapi hindari genangan']),
('Sayuran', 'panen', 'Panen', 5, '🧺', '#795548', 'Buah sudah matang dan siap dipetik!', ARRAY['Panen di pagi hari untuk kesegaran optimal', 'Gunakan pisau atau gunting bersih', 'Jangan tarik buah, potong tangkainya', 'Simpan hasil panen di tempat sejuk']);

-- Rempah (Herbs/Spices) - 4 phases
INSERT INTO plant_phase_definitions (category, phase_key, phase_name, phase_order, icon, color, description, care_tips) VALUES
('Rempah', 'semai', 'Semai', 1, '🌱', '#8BC34A', 'Tahap awal pertumbuhan dari biji atau stek.', ARRAY['Jaga media tanam tetap lembab', 'Letakkan di tempat dengan cahaya tidak langsung', 'Untuk stek, celupkan ke hormon perangsang akar', 'Hindari sinar matahari langsung di minggu pertama']),
('Rempah', 'vegetatif', 'Vegetatif', 2, '🌿', '#4CAF50', 'Daun dan batang tumbuh subur, siap untuk dipanen sebagian.', ARRAY['Pupuk dengan kompos atau pupuk organik', 'Pangkas ujung untuk merangsang pertumbuhan samping', 'Bisa mulai panen daun muda secukupnya', 'Pastikan drainase baik untuk mencegah busuk akar']),
('Rempah', 'dewasa', 'Dewasa', 3, '🌳', '#2E7D32', 'Tanaman sudah mapan dan produktif untuk panen rutin.', ARRAY['Panen rutin untuk merangsang pertumbuhan baru', 'Jangan panen lebih dari 1/3 tanaman sekaligus', 'Berikan pupuk setiap 2-4 minggu', 'Perhatikan hama seperti kutu daun']),
('Rempah', 'berbunga', 'Berbunga', 4, '🌸', '#E91E63', 'Tanaman mulai berbunga, rasa daun bisa berubah.', ARRAY['Pangkas bunga jika ingin daun tetap aromatik', 'Biarkan berbunga jika ingin mengumpulkan biji', 'Kurangi panen daun saat fase ini', 'Bunga bisa dimakan atau dikeringkan']);

-- Bunga (Flowers) - 4 phases
INSERT INTO plant_phase_definitions (category, phase_key, phase_name, phase_order, icon, color, description, care_tips) VALUES
('Bunga', 'semai', 'Semai', 1, '🌱', '#8BC34A', 'Tahap awal dari biji atau bibit kecil.', ARRAY['Tanam di media semai yang gembur', 'Jaga kelembaban tanpa menggenang', 'Berikan cahaya terang tidak langsung', 'Pindahkan setelah ada 4-6 daun sejati']),
('Bunga', 'vegetatif', 'Vegetatif', 2, '🌿', '#4CAF50', 'Tanaman tumbuh membentuk daun dan struktur.', ARRAY['Pindahkan ke pot definitif', 'Berikan pupuk seimbang NPK', 'Pangkas untuk bentuk yang kompak', 'Siram teratur sesuai kebutuhan spesies']),
('Bunga', 'kuncup', 'Kuncup', 3, '🌷', '#9C27B0', 'Kuncup bunga mulai terbentuk.', ARRAY['Tingkatkan pupuk fosfor untuk pembungaan', 'Hindari memindahkan tanaman', 'Jaga kelembaban tanah stabil', 'Berikan cahaya yang cukup']),
('Bunga', 'mekar', 'Mekar', 4, '🌺', '#E91E63', 'Bunga mekar sempurna, nikmati keindahannya!', ARRAY['Potong bunga layu untuk merangsang bunga baru', 'Siram di pagi hari, hindari membasahi bunga', 'Berikan pupuk rendah nitrogen', 'Dokumentasikan keindahan bungamu!']);

-- Tanaman Hias (Ornamental Plants) - 3 phases
INSERT INTO plant_phase_definitions (category, phase_key, phase_name, phase_order, icon, color, description, care_tips) VALUES
('Tanaman Hias', 'adaptasi', 'Adaptasi', 1, '🌱', '#8BC34A', 'Tanaman baru menyesuaikan diri dengan lingkungan.', ARRAY['Letakkan di tempat teduh selama 1-2 minggu', 'Jangan langsung repot, biarkan beradaptasi', 'Siram secukupnya, jangan berlebihan', 'Hindari pupuk di fase ini']),
('Tanaman Hias', 'pertumbuhan', 'Pertumbuhan', 2, '🌿', '#4CAF50', 'Tanaman tumbuh aktif dengan daun baru.', ARRAY['Pindahkan ke pot lebih besar jika perlu', 'Berikan pupuk setiap 2-4 minggu', 'Putar pot secara berkala untuk pertumbuhan merata', 'Bersihkan daun dari debu']),
('Tanaman Hias', 'mapan', 'Mapan', 3, '🪴', '#2E7D32', 'Tanaman sudah stabil dan mudah dirawat.', ARRAY['Lanjutkan perawatan rutin', 'Repot setiap 1-2 tahun', 'Pangkas daun kuning atau rusak', 'Perhatikan tanda-tanda hama atau penyakit']);

-- Verify insertion
SELECT category, COUNT(*) as phase_count FROM plant_phase_definitions GROUP BY category ORDER BY category;
