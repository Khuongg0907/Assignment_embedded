#pragma once
// Hoặc dùng:
// #ifndef MQ2_H
// #define MQ2_H
// ...
// #endif

#include <Arduino.h>
#include <MQUnifiedsensor.h>
#include <ThingsBoard.h>
#include "global.h"

// ---- Cấu hình phần cứng MQ-2 ----
#define Board              ("ESP-32-S3")
#define Pin                (1)     // GPIO34 (ADC) cho MQ-2
// ---- Cấu hình phần mềm MQ-2 ----
#define Type               ("MQ-2") // MQ2
#define Voltage_Resolution (3.3)
#define ADC_Bit_Resolution (12)     // 12-bit ADC cho ESP32
#define RatioMQ2CleanAir   (9.83)   // RS / R0 = 9.83 ppm

// Được định nghĩa ở file khác (coreiot.cpp / main.cpp)
extern ThingsBoard thingsBoard;

// Object cảm biến MQ-2 dùng chung cho toàn project
extern MQUnifiedsensor MQ2;

// Task đọc MQ-2
void readMQ2Gas(void *pvParameters);
void initMQ2();
