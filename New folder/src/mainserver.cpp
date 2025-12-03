// mainserver.cpp
#include "mainserver.h"

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include "global.h"
// ================== SERVER & BIẾN TOÀN CỤC ==================

WebServer server(80);

// Các biến config / trạng thái
String mqtt_server   = "app.coreiot.io";
String mqtt_port     = "1883";
int    sendInterval  = 5;          // giây
String mqtt_token    = "";
String deviceId      = "ESP32_Core";

bool isAPMode        = true;
bool connecting      = false;
unsigned long connect_start_ms = 0;

// ===== Các biến/định nghĩa được khai báo ở file khác =====
// bạn đã có sẵn trong project nên để extern ở đây

extern float glob_temperature;
extern float glob_humidity;
extern float glob_gas;
extern float glob_light;

extern bool  isWifiConnected;
extern bool  glob_led_D3;
extern bool  glob_led_NEO;

extern SemaphoreHandle_t xBinarySemaphoreInternet;

// SSID / password cho AP mode (đang dùng trước đó)
extern String ssid;        // AP SSID
extern String password;    // AP password
extern const int BOOT_PIN; // nút BOOT về AP mode


// ================== HỖ TRỢ CORS (OPTIONS) ==================

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204); // No Content
}


// ================== API: /api/data ==================
// React sẽ gọi endpoint này để lấy dữ liệu cảm biến real-time
//
// GET /api/data
// Response:
// {
//   "sensors": {
//     "temp": 28.5,
//     "hum": 65,
//     "gas": 120,
//     "light": 450
//   }
// }

void handleApiData() {
  StaticJsonDocument<256> doc;
  JsonObject sensors = doc.createNestedObject("sensors");

  sensors["temp"]  = glob_temperature;
  sensors["hum"]   = glob_humidity;
  sensors["gas"]   = glob_gas;
  sensors["light"] = glob_light;

  String response;
  serializeJson(doc, response);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}


// ================== API: /api/scan ==================

void handleApiScan() {
  Serial.println("Scanning WiFi networks for /api/scan...");
  int n = WiFi.scanNetworks(false, true); // async=false, show_hidden=true

  StaticJsonDocument<1024> doc;
  JsonArray networks = doc.createNestedArray("networks");

  for (int i = 0; i < n; i++) {
    JsonObject net = networks.createNestedObject();
    net["ssid"] = WiFi.SSID(i);
    net["rssi"] = WiFi.RSSI(i);
  }

  WiFi.scanDelete();

  String response;
  serializeJson(doc, response);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}


// ================== API: /api/config (GET) ==================

void handleApiConfigGet() {
  StaticJsonDocument<256> doc;
  doc["deviceId"]     = deviceId;
  doc["wifiSSID"]     = wifi_ssid;
  doc["server"]       = mqtt_server;
  doc["port"]         = mqtt_port;
  doc["sendInterval"] = sendInterval;
  doc["token"]        = mqtt_token;

  String response;
  serializeJson(doc, response);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}


// ================== API: /api/config (POST) ==================

void handleApiConfigPost() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json",
                "{\"success\":false,\"message\":\"No body\"}");
    return;
  }

  String body = server.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, body);

  if (err) {
    server.send(400, "application/json",
                "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }

  if (doc.containsKey("deviceId"))
    deviceId = (const char*)doc["deviceId"];

  if (doc.containsKey("wifiSSID"))
    wifi_ssid = (const char*)doc["wifiSSID"];

  if (doc.containsKey("wifiPass"))
    wifi_password = (const char*)doc["wifiPass"];

  if (doc.containsKey("server"))
    mqtt_server = (const char*)doc["server"];

  if (doc.containsKey("port"))
    mqtt_port = (const char*)doc["port"];

  if (doc.containsKey("token"))
    mqtt_token = (const char*)doc["token"];

  if (doc.containsKey("sendInterval"))
    sendInterval = doc["sendInterval"].as<int>();

  // TODO: nếu muốn giữ config sau reboot -> lưu vào NVS / Preferences / SPIFFS tại đây

  // Bắt đầu thử kết nối WiFi mới (STA)
  isAPMode         = false;
  connecting       = true;
  connect_start_ms = millis();
  connectToWiFi();

  StaticJsonDocument<128> resp;
  resp["success"] = true;
  resp["message"] = "Config saved, reconnecting WiFi...";

  String response;
  serializeJson(resp, response);

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}


// ================== WIFI MODE ==================

// AP MODE: dùng để cấu hình ban đầu qua React
void startAP() {
  // Ngắt mọi kết nối cũ (STA + AP) cho sạch
  WiFi.disconnect(true);
  WiFi.softAPdisconnect(true);
  delay(100);

  // AP + STA để vẫn scan được mạng xung quanh cho /api/scan
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(ssid.c_str(), password.c_str());

  Serial.print("AP IP address: ");
  Serial.println(WiFi.softAPIP());

  isAPMode        = true;
  connecting      = false;
  isWifiConnected = false;
}

// STA MODE: kết nối vào WiFi có Internet (ACLAB / WiFi nhà)
void connectToWiFi() {
  // KHÔNG disconnect AP để tránh mất kết nối với user
  // Chỉ disconnect STA cũ
  WiFi.disconnect(true);        // ngắt STA & clear config cũ
  delay(100);

  // FIX: Dùng AP_STA thay vì chỉ STA
  // → Vẫn giữ AP Mode để user không bị disconnect
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());

  Serial.print("Connecting to: ");
  Serial.print(wifi_ssid);
  Serial.print("  Password: ");
  Serial.println(wifi_password);
}



// ================== ĐĂNG KÝ ROUTE HTTP ==================

void setupServer() {
  // Sensors
  server.on("/api/data",    HTTP_GET,     handleApiData);
  server.on("/api/data",    HTTP_OPTIONS, handleOptions);

  // WiFi scan
  server.on("/api/scan",    HTTP_GET,     handleApiScan);
  server.on("/api/scan",    HTTP_OPTIONS, handleOptions);

  // Config
  server.on("/api/config",  HTTP_GET,     handleApiConfigGet);
  server.on("/api/config",  HTTP_POST,    handleApiConfigPost);
  server.on("/api/config",  HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP server started (API mode only)");
}


// ================== MAIN SERVER TASK ==================

void main_server_task(void *pvParameters){
  pinMode(BOOT_PIN, INPUT_PULLUP);

  // Khởi động ở AP mode để cấu hình ban đầu
  startAP();
  setupServer();

  while (1) {
    server.handleClient();

    // Nút BOOT: giữ > ~100ms để về AP mode
    if (digitalRead(BOOT_PIN) == LOW) {
      vTaskDelay(100 / portTICK_PERIOD_MS);
      if (digitalRead(BOOT_PIN) == LOW) {
        if (!isAPMode) {
          Serial.println("BOOT pressed -> back to AP mode");
          startAP();
          setupServer();  // đảm bảo server vẫn sống
        }
      }
    }

    // Đang trong trạng thái kết nối STA tới router
    if (connecting) {
      if (WiFi.status() == WL_CONNECTED) {
        Serial.print("STA connected, IP: ");
        Serial.println(WiFi.localIP());

        isWifiConnected = true;
        xSemaphoreGive(xBinarySemaphoreInternet);

        isAPMode   = false;
        connecting = false;
      }
      else if (millis() - connect_start_ms > 10000) { // timeout 10s
        Serial.println("WiFi connect failed! Back to ");
        startAP();
        setupServer();
        connecting      = false;
        isWifiConnected = false;
      }
    }
    
    // ====== FIX: Kiểm tra WiFi liên tục sau khi đã kết nối ======
    // Nếu đang ở STA mode (ko phải AP), kiểm tra connection status
    static unsigned long lastWiFiCheck = 0;
    if (!isAPMode && !connecting) {
      // Kiểm tra mỗi 5 giây
      if (millis() - lastWiFiCheck > 5000) {
        lastWiFiCheck = millis();
        
        if (WiFi.status() != WL_CONNECTED) {
          Serial.println("WiFi disconnected! Attempting reconnect...");
          
          // Thử reconnect
          WiFi.reconnect();
          unsigned long reconnect_start = millis();
          
          // Chờ tối đa 10 giây
          while (WiFi.status() != WL_CONNECTED && (millis() - reconnect_start < 10000)) {
            vTaskDelay(500 / portTICK_PERIOD_MS);
            Serial.print(".");
          }
          
          if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\nReconnected successfully!");
            Serial.print("IP: ");
            Serial.println(WiFi.localIP());
            isWifiConnected = true;
          } else {
            Serial.println("\nReconnect failed! Switching to AP mode...");
            startAP();
            setupServer();
            isWifiConnected = false;
          }
        }
      }
    }

    // glob_led_D3  = led1_state;
    // glob_led_NEO = led2_state;

    vTaskDelay(20 / portTICK_PERIOD_MS); // tránh watchdog
  }
}
