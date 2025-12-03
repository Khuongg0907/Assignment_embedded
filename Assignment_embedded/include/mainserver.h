// mainserver.h
#pragma once

#include <Arduino.h>
#include <WebServer.h>

// Web server HTTP
extern WebServer server;

// Các hàm khởi tạo / task chính
void startAP();
void connectToWiFi();
void setupServer();
void main_server_task(void *pvParameters);
