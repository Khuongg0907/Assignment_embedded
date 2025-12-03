# Hướng dẫn Firmware ESP32

Dashboard này cần ESP32 chạy **Web Server** với các API endpoint sau để hoạt động đầy đủ.

## 📡 API Endpoints Cần Thiết

### 1. Lấy dữ liệu cảm biến (Real-time Data)
```
GET /api/data
```

**Response:**
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

### 2. Quét WiFi
```
GET /api/scan
```

**Response:**
```json
{
  "networks": [
    { "ssid": "MyWiFi", "rssi": -45 },
    { "ssid": "Office_5G", "rssi": -67 }
  ]
}
```

---

### 3. Tải cấu hình hiện tại
```
GET /api/config
```

**Response:**
```json
{
  "deviceId": "ESP32_01",
  "wifiSSID": "MyWiFi",
  "server": "mqtt.example.com",
  "port": "1883",
  "sendInterval": 5
}
```

---

### 4. Lưu cấu hình mới
```
POST /api/config
Content-Type: application/json
```

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

**Response:**
```json
{
  "success": true,
  "message": "Config saved, rebooting..."
}
```

---

## 🛠️ Ví dụ Code ESP32 (PlatformIO)

### platformio.ini
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps = 
    ESP Async WebServer
    ArduinoJson
    DHT sensor library
```

### main.cpp (Skeleton)
```cpp
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <DHT.h>

AsyncWebServer server(80);

// Sensors
#define DHT_PIN 4
DHT dht(DHT_PIN, DHT22);

void setup() {
  Serial.begin(115200);
  
  // Connect WiFi
  WiFi.begin("YourWiFi", "password");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());

  // CORS headers
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

  // API: Get sensor data
  server.on("/api/data", HTTP_GET, [](AsyncWebServerRequest *request){
    StaticJsonDocument<200> doc;
    doc["sensors"]["temp"] = dht.readTemperature();
    doc["sensors"]["hum"] = dht.readHumidity();
    doc["sensors"]["gas"] = analogRead(34); // MQ2 on GPIO34
    doc["sensors"]["light"] = analogRead(35); // LDR on GPIO35
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });

  // API: Scan WiFi
  server.on("/api/scan", HTTP_GET, [](AsyncWebServerRequest *request){
    int n = WiFi.scanNetworks();
    StaticJsonDocument<1024> doc;
    JsonArray networks = doc.createNestedArray("networks");
    
    for (int i = 0; i < n; i++) {
      JsonObject net = networks.createNestedObject();
      net["ssid"] = WiFi.SSID(i);
      net["rssi"] = WiFi.RSSI(i);
    }
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });

  // API: Load config
  server.on("/api/config", HTTP_GET, [](AsyncWebServerRequest *request){
    // Load from EEPROM/SPIFFS
    StaticJsonDocument<512> doc;
    doc["deviceId"] = "ESP32_01";
    doc["wifiSSID"] = WiFi.SSID();
    doc["server"] = "mqtt.example.com";
    doc["port"] = "1883";
    doc["sendInterval"] = 5;
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });

  // API: Save config
  server.on("/api/config", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<512> doc;
      deserializeJson(doc, (char*)data);
      
      // Save to EEPROM/SPIFFS
      String ssid = doc["wifiSSID"];
      String pass = doc["wifiPass"];
      // ... save logic
      
      request->send(200, "application/json", "{\"success\":true}");
      
      // Optional: Reboot ESP32 to apply new WiFi
      delay(1000);
      ESP.restart();
    }
  );

  server.begin();
}

void loop() {
  // Main loop
  delay(100);
}
```

---

## 🚀 Bước Tiếp Theo

1. **Tạo project PlatformIO** với cấu trúc trên
2. **Kết nối sensors**: DHT22, MQ2, LDR theo sơ đồ
3. **Upload firmware** lên ESP32
4. **Kiểm tra IP**: ESP32 sẽ in IP ra Serial Monitor
5. **Test API**: Dùng Postman hoặc browser test `http://[ESP32_IP]/api/data`
6. **Kết nối Dashboard**: Dashboard sẽ tự động chuyển sang chế độ thực khi phát hiện API

---

## 📝 Lưu Ý

- **CORS**: Cần enable CORS để React (localhost:5173) gọi được ESP32
- **Static IP**: Nên cấu hình Static IP cho ESP32 để dễ quản lý
- **Bảo mật**: Nên thêm authentication (API key/token) trong production
- **WiFi cấu hình**: Có thể dùng WiFiManager library để setup WiFi qua AP mode

---

