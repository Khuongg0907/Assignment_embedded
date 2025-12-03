// lightsensor.h
#pragma once

#include <Arduino.h>
#include "global.h"
#define LIGHT_SENSOR_PIN 2
void initLightSensor();
void readLightSensor();                 // hàm đọc 1 lần
void readLightSensorTask(void *pvParameters); 