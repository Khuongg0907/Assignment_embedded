#ifndef __TEMP_HUMI_MONITOR__
#define __TEMP_HUMI_MONITOR__
#include <Arduino.h>
#include "LiquidCrystal_I2C.h"
#include "DHT20.h"
#include <SimpleDHT.h>
#include "global.h"



#define SDA_PIN GPIO_NUM_11       // đổi theo dây thực tế (ESP32-S3 của bạn)
#define SCL_PIN GPIO_NUM_12


void temp_humi_monitor(void *pvParameters) ;


#endif