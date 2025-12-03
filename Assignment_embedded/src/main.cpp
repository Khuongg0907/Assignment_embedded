#include "global.h"

#include "led_blinky.h"
#include "neo_blinky.h"
#include "temp_humi_monitor.h"
#include "mainserver.h"
#include "mq2.h"
#include "lightsensor.h"
#include "coreiot.h"


void setup() {
    Serial.begin(115200);

  initMQ2();

  

  xTaskCreate(led_blinky, "Task LED Blink" ,2048  ,NULL  ,2 , NULL);
  xTaskCreate(neo_blinky, "Task NEO Blink" ,2048  ,NULL  ,2 , NULL);
  xTaskCreate(temp_humi_monitor, "Task Temp Humi" ,2048  ,NULL  ,2 , NULL);
  xTaskCreate(main_server_task, "Task Main Server" ,8192  ,NULL  ,2 , NULL);
  xTaskCreate( readMQ2Gas, "Read MQ2 Task" ,2048  ,NULL  ,2 , NULL);
  xTaskCreate( readLightSensorTask, "Read Light Sensor" ,2048  ,NULL  ,2 , NULL);
  xTaskCreate(coreiot_task, "CoreIOT Task" ,4096  ,NULL  ,2 , NULL);
}

void loop()
{
}