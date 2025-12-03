#include "global.h"

// Read: mainserver.cpp, coreiot.cpp
// Write: temp_humi_monitor.cpp
float glob_temperature = 0; //global variable for temperature
float glob_humidity = 0;    //global variable for humidity
float glob_gas         = 0; 
float glob_light=0;
const int BOOT_PIN = 0; 
// Read: led_blinky.cpp
// Write: mainserver.cpp
bool glob_led_D3 = false;    //global variable for LED D3

// Read: neo_blinky.cpp
// Write: mainserver.cpp
bool glob_led_NEO = false;   //global variable for NEO LED

// !!! Vì mỗi biến toàn cục trên đều chỉ có một task ghi nên ko cần mutex

String ssid = "ESP32-YOUR NETWORK HERE!!!";
String password = "12345678";
String wifi_ssid = "ACLAB";
String wifi_password = "ACLAB2023";
boolean isWifiConnected = false;
SemaphoreHandle_t xBinarySemaphoreInternet = xSemaphoreCreateBinary();
