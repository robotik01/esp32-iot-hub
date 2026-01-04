# Google Sheets Setup untuk ESP32 IoT Hub

## Struktur Sheet Baru

Sistem sekarang menggunakan **1 sheet untuk setiap ESP32 device** dengan format:

### Sheet Utama:
1. **DeviceList** - Daftar semua ESP32 yang terdaftar
2. **AutomationRules** - Aturan otomasi
3. **Users** - Daftar pengguna
4. **ActivityLog** - Log aktivitas sistem

### Sheet per Device:
Setiap ESP32 mendapat sheet sendiri dengan format: `ESP32_[DeviceID]`

**Kolom dalam sheet device:**
- Timestamp
- Temperature (°C)
- Humidity (%)
- Light (lux)
- Motion (0/1)
- Relay1 (0/1)
- Relay2 (0/1)
- Relay3 (0/1)
- Relay4 (0/1)
- Notes

## Langkah Setup

### 1. Buka Google Sheets
https://docs.google.com/spreadsheets/d/1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8/edit

### 2. Buka Apps Script Editor
- Klik **Extensions** → **Apps Script**
- Hapus semua kode default

### 3. Copy Script Baru
- Buka file: `website/google-apps-script.js`
- Copy semua kode
- Paste ke Apps Script Editor
- Klik **Save** (ikon disket atau Ctrl+S)

### 4. Deploy sebagai Web App
1. Klik **Deploy** → **New deployment**
2. Klik icon gear (⚙️) di sebelah "Select type"
3. Pilih **Web app**
4. Isi konfigurasi:
   - **Description**: ESP32 IoT Hub API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Klik **Deploy**
6. **Authorize** akses (pilih akun Google Anda)
7. Copy **Web app URL** yang muncul

### 5. Update Website Config
Edit file `website/src/config/constants.js`:

```javascript
export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: '1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8',
  API_URL: 'PASTE_WEB_APP_URL_HERE'  // Ganti dengan URL dari step 4
};
```

### 6. Initialize Sheets (Opsional)
Di Apps Script Editor:
1. Pilih function `setup` dari dropdown
2. Klik **Run** (▶️)
3. Authorize jika diminta
4. Cek Spreadsheet - sheet dasar sudah terbuat

### 7. Test Connection
- Buka website: https://robotik01.github.io/esp32-iot-hub/
- ESP32 pertama yang mengirim data akan otomatis membuat sheet sendiri

## Cara Kerja

### Saat ESP32 Mengirim Data:
1. System check apakah device sudah terdaftar di **DeviceList**
2. Jika belum, buat:
   - Entry baru di **DeviceList**
   - Sheet baru dengan nama `ESP32_[DeviceID]`
3. Data sensor & relay disimpan dalam 1 row di sheet device
4. Update timestamp "Last Seen" di **DeviceList**

### Format Data yang Dikirim ESP32:
```
GET atau POST ke Web App URL dengan parameters:
?action=log
&deviceId=ESP32_001
&temp=28.5
&humidity=65
&light=450
&motion=1
&relay1=1
&relay2=0
&relay3=0
&relay4=1
```

## Contoh Device Sheets

### ESP32_001
| Timestamp | Temperature | Humidity | Light | Motion | Relay1 | Relay2 | Relay3 | Relay4 |
|-----------|------------|----------|-------|--------|--------|--------|--------|--------|
| 2026-01-04 10:00:00 | 28.5 | 65 | 450 | 1 | 1 | 0 | 0 | 1 |
| 2026-01-04 10:01:00 | 28.6 | 64 | 455 | 0 | 1 | 0 | 0 | 1 |

### ESP32_002
| Timestamp | Temperature | Humidity | Light | Motion | Relay1 | Relay2 | Relay3 | Relay4 |
|-----------|------------|----------|-------|--------|--------|--------|--------|--------|
| 2026-01-04 10:00:15 | 25.2 | 70 | 320 | 0 | 0 | 1 | 1 | 0 |

## Keuntungan Sistem Baru

✅ **Organized** - Setiap ESP32 punya data terpisah
✅ **Scalable** - Mudah menambah device baru
✅ **Clear** - Data tidak tercampur antar device
✅ **Efficient** - Query data lebih cepat per device
✅ **Flexible** - Setiap device bisa punya konfigurasi berbeda

## Troubleshooting

### Sheet tidak terbuat otomatis?
- Pastikan Web App URL sudah benar di `constants.js`
- Cek authorization di Apps Script
- Test dengan manual run function `setup()`

### Data tidak masuk?
- Cek di Apps Script: **Executions** untuk melihat error log
- Pastikan parameter `deviceId` dikirim dari ESP32
- Verify Web App access setting: "Anyone"

### Error "Not authorized"?
- Re-deploy Web App
- Pastikan "Execute as" = Me
- Pastikan "Who has access" = Anyone
