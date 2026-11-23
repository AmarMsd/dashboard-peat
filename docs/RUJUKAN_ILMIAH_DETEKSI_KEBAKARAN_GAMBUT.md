# Landasan Ilmiah & Ambang Batas (Threshold) Deteksi Dini Kebakaran Hutan Gambut

Dokumen ini disusun sebagai acuan saintifik untuk sistem pemantauan telemetri lahan gambut (*PeatGuard*). Penentuan nilai ambang batas (*threshold*) didasarkan pada riset pembakaran gambut (*smouldering combustion kinetics*), studi iklim mikro lahan gambut tropis Indonesia, serta regulasi hidrologi gambut nasional.

---

## 1. Karakteristik Fisik Kebakaran Gambut
Berbeda dengan kebakaran hutan mineral yang merambat di permukaan kanopi/semak (*flaming fire*), kebakaran lahan gambut tropis didominasi oleh **kebakaran tanpa nyala / membara di bawah permukaan (*smouldering combustion*)**:
- Merambat secara perlahan di bawah lapisan serasah (kedalaman 10–50 cm).
- Memiliki efisiensi pembakaran tidak sempurna yang tinggi, menghasilkan emisi karbon monoksida ($CO$), $CO_2$, metana ($CH_4$), dan partikulat asap tebal ($PM_{2.5}$).
- Sangat sulit dipadamkan jika sudah terbentuk titik bara (*hotspot underground*), bahkan dapat bertahan selama berminggu-minggu hingga musim hujan tiba.

---

## 2. Matriks Ambang Batas Sensor

Sistem menggunakan 3 parameter fisis utama:

| Parameter | Satuan | Kondisi **Aman** (*Normal*) | Kondisi **Waspada** (*Warning*) | Kondisi **Kritis / Bahaya** (*Critical*) | Peran & Dinamika Fisik |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kelembapan Tanah (*Moisture*)** | $\%$ | **$\ge 60\%$** | **$40.0\% - 59.9\%$** | **$< 40.0\%$** | Pertahanan fisik primer. Menentukan ketersediaan air pori untuk mendinginkan energi aktivasi pirolisis. |
| **Suhu Lapisan Tanah (*Soil Temp*)** | $^\circ\text{C}$ | **$25.0^\circ\text{C} - 31.9^\circ\text{C}$** | **$32.0^\circ\text{C} - 34.9^\circ\text{C}$** | **$\ge 35.0^\circ\text{C}$** | Indikator termal. Mendeteksi akumulasi radiasi ekstrem atau keberadaan bara aktif di dekat sensor. |
| **Keasaman Tanah (*Soil pH*)** | pH | **$3.5 - 5.0$** *(Alami)* | **$< 3.2$** *(Asam Ekstrem)* <br>atau **$> 5.5$** *(Basa Anomali)* | **$< 2.8$** <br>atau **$> 6.5$** | Indikator biokimia. Mengidentifikasi pengeringan kronis (oksidasi pirit) atau pelepasan abu sisa pembakaran. |

---

## 3. Rujukan Ilmiah & Regulasi

### A. Kelembapan Tanah & Batas Padam Kritis (*Critical Moisture of Extinction / CME*)
- **Paper:** Huang, X., & Rein, G. (2015). *Smouldering combustion of peat in wildfires: inverse modelling of the drying and the pyrolysis and oxidation kinetics*. **International Journal of Wildland Fire**, 24(2), 257–269.  
- **Paper:** Frandsen, W. H. (1997). *Ignition probability of organic soils*. **Canadian Journal of Forest Research**, 27(9), 1471–1477.
- **Kesimpulan Ilmiah:**
  - Ambang kelembapan di mana api bara tidak dapat lagi merambat (*Critical Moisture of Extinction*) untuk gambut tropis berada di rentang $50\% - 65\%$ (bergantung pada kandungan bahan anorganik/abu).
  - Ketika kadar air $\ge 60\%$, panas pembakaran habis diserap untuk menguapkan air pori (*latent heat of vaporization* $2.26\text{ MJ/kg}$), sehingga reaksi pirolisis terhenti secara alami (*quenching*).
  - Pada kadar air $40\% - 60\%$, gambut mulai rentan terbakar jika ada pemicu eksternal atau tiupan angin.
  - Pada kadar air $< 40\%$, gambut mengalami kekeringan hidrofobik tak balik (*irreversible drying*), porositas udara meningkat, dan probabilitas penyulutan mendekati $100\%$.

### B. Suhu Tanah & Deteksi Bara Bawah Permukaan
- **Paper:** Usup, A., Hashimoto, Y., Takahashi, H., & Hayasaka, H. (2004). *Combustion characteristics of peat in Central Kalimantan, Indonesia*. **Tropics**, 14(1), 1–19.
- **Paper:** Saharjo, B. H., & Nurhayati, A. D. (2006). *Karakteristik Pembakaran dan Suhu Bawah Permukaan Lahan Gambut Terdegradasi*. **Jurnal Silvikultur Tropika / IPB**.
- **Kesimpulan Ilmiah:**
  - Di bawah naungan kanopi dan hidrologi gambut yang terjaga, suhu tanah pada kedalaman 10–30 cm relatif stabil pada $26.0^\circ\text{C} - 30.5^\circ\text{C}$.
  - Kenaikan suhu ke rentang $32.0^\circ\text{C} - 34.9^\circ\text{C}$ menandakan pengeringan lapisan atas (*desiccation*) dan peningkatan laju konduksi termal permukaan.
  - Suhu $\ge 35.0^\circ\text{C}$ pada kedalaman sensor adalah anomali termal kuat yang menunjukkan transmisi panas dari bara api bawah tanah (*subsurface thermal hotspot*).

### C. Keasaman Tanah (pH) sebagai Indikator Lingkungan Gambut
- **Paper:** Page, S. E., Rieley, J. O., & Banks, C. J. (2011). *Global and regional importance of the tropical peatland carbon pool*. **Global Change Biology**, 17(2), 798–818.
- **Kesimpulan Ilmiah:**
  - Gambut rawa ombrogenik di Indonesia secara alami sangat masam ($pH\ 3.5 - 4.5$) akibat asam humat dan asam fulvat terlarut.
  - Gambut yang mengering berlebihan menyebabkan lapisan pirit ($FeS_2$) di bawahnya teroksidasi oleh oksigen udara bebas, menghasilkan asam sulfat ($H_2SO_4$) yang menjatuhkan nilai $pH < 3.2$.
  - Sebaliknya, saat lahan terbakar, kation basa ($Ca^{2+}, Mg^{2+}, K^+$) pada abu sisa pembakaran larut terbawa air pori, memicu lonjakan $pH > 5.5 - 6.5$.

### D. Regulasi Nasional Republik Indonesia
- **Peraturan Pemerintah Republik Indonesia No. 57 Tahun 2016** jo. **PP No. 71 Tahun 2014** tentang *Perlindungan dan Pengelolaan Ekosistem Gambut*.
- **Pedoman Teknis Badan Restorasi Gambut dan Mangrove (BRGM)** mengenai *Sistem Pemantauan Air Lahan Gambut (SIPALAGA)*:
  - Mewajibkan ambang batas kedalaman muka air tanah maksimal **0.4 meter (40 cm)** dari permukaan tanah.
  - Penurunan air tanah melampaui 40 cm berkolerasi linier dengan penurunan kelembapan tanah lapisan atas di bawah 40%, memicu status siaga kebakaran hutan dan lahan (Karhutla).

---

## 4. Logika Evaluasi Sistem (Algoritma Kode)

Sistem `evaluateSensorStatus(sensor)` di `app/data/sensors.js` menjalankan algoritma deterministik berikut:

```javascript
if (moisture < 40 || temperature >= 35.0 || ph < 2.8 || ph > 6.5) {
  return "critical"; // Status: Kritis / Bahaya
}

if (
  (moisture >= 40 && moisture < 60) ||
  (temperature >= 32.0 && temperature < 35.0) ||
  (ph < 3.2 || ph > 5.5)
) {
  return "warning"; // Status: Waspada
}

return "normal"; // Status: Aman
```
