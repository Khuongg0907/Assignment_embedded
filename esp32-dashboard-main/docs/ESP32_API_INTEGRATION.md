# ESP32 Dashboard - Tích hợp API

Dashboard đã được cập nhật để **gọi API thực** xuống ESP32. Firmware ESP32 cần implement các endpoint sau.

---

## 🔌 API Endpoints

### 1. **GET /api/data** - Lấy dữ liệu cảm biến
Dashboard tự động gọi endpoint này mỗi 2-5 giây (tùy cấu hình).

**Response mẫu:**
```json
{
  "sensors": {
    "temp": 28.5,
    "hum": 65,
    "gas": 120,
    "light": 450
  }
}
```

---

### 2. **GET /api/scan** - Quét WiFi
Gọi khi user nhấn nút "Quét WiFi" trong tab Cấu hình.

**Response mẫu:**
```json
{
  "networks": [
    { "ssid": "MyWiFi", "rssi": -45 },
    { "ssid": "Office_5G", "rssi": -67 }
  ]
}
```

---

### 3. **GET /api/config** - Lấy cấu hình hiện tại
Gọi khi user nhấn "Tải từ thiết bị".

**Response mẫu:**
```json
{
  "deviceId": "ESP32_01",
  "wifiSSID": "MyWiFi",
  "server": "mqtt.example.com",
  "port": "1883",
  "sendInterval": 5
}
```

> **Lưu ý**: Không trả về `wifiPass` vì lý do bảo mật.

---

### 4. **POST /api/config** - Lưu cấu hình mới
Gọi khi user nhấn "Lưu lên thiết bị".

**Request Body:**
```json
{
  "deviceId": "ESP32_01",
  "wifiSSID": "NewWiFi",
  "wifiPass": "password123",
  "token": "your-iot-token",
  "server": "mqtt.example.com",
  "port": "1883",
  "sendInterval": 5
}
```

**Response mẫu:**
```json
{
  "success": true,
  "message": "Cấu hình đã lưu, ESP32 sẽ khởi động lại..."
}
```

> **Khuyến nghị**: ESP32 nên reboot sau khi lưu config để áp dụng WiFi mới.

---

## 🛠️ Code ESP32 Mẫu

Xem file [`ESP32_FIRMWARE_GUIDE.md`](./ESP32_FIRMWARE_GUIDE.md) để biết:
- Cấu trúc project PlatformIO
- Code mẫu với AsyncWebServer
- Cách setup CORS
- Lưu config với SPIFFS/EEPROM

---

## 🔄 Chế độ Fallback

Dashboard xử lý lỗi kết nối một cách thông minh:

- **WiFi Scan**: Nếu ESP32 không phản hồi → hiển thị danh sách WiFi giả
- **Load Config**: Nếu lỗi → thông báo lỗi rõ ràng
- **Save Config**: Nếu lỗi → thông báo lỗi rõ ràng
- **Data Fetch**: Nếu lỗi 3 lần → tự động chuyển về Demo Mode

---

## 📍 Địa chỉ IP

Dashboard sẽ gọi API theo địa chỉ:
- **Development**: `http://localhost:5173/api/*` → proxy đến ESP32 (cấu hình trong `vite.config.js`)
- **Production**: `http://[ESP32_IP]/api/*` → gọi trực tiếp

### Cấu hình Vite Proxy (Khuyến nghị)

Thêm vào `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.1.100', // Thay bằng IP ESP32
        changeOrigin: true,
      }
    }
  }
})
```

---

## ✅ Checklist Triển Khai

- [ ] Upload firmware ESP32 với 4 API endpoints
- [ ] Kiểm tra ESP32 đã kết nối WiFi
- [ ] Test từng endpoint bằng Postman/Browser
- [ ] Cấu hình proxy trong `vite.config.js` (dev mode)
- [ ] Build dashboard: `npm run build`
- [ ] Deploy dashboard lên ESP32 hoặc web server

---

## 🐛 Xử lý lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|------|-------------|-----------|
| CORS error | ESP32 chưa enable CORS | Thêm headers trong ESP32 code |
| 404 Not Found | ESP32 chưa có endpoint | Kiểm tra routing trong ESP32 |
| Network error | ESP32 offline | Kiểm tra IP, WiFi connection |
| Timeout | ESP32 phản hồi chậm | Tăng timeout hoặc tối ưu code ESP32 |

---

Để biết thêm chi tiết, xem [`ESP32_FIRMWARE_GUIDE.md`](./ESP32_FIRMWARE_GUIDE.md)!
