#include "mq2.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// Tạo object MQ2 đúng 1 lần ở đây
MQUnifiedsensor MQ2(Board, Voltage_Resolution, ADC_Bit_Resolution, Pin, Type);
void initMQ2() {
    Serial.begin(115200);  // nếu bạn muốn giữ ở main.cpp thì bỏ dòng này

    MQ2.setRegressionMethod(1);   // ppm = a * ratio^b
    MQ2.setA(574.25);
    MQ2.setB(-2.222);

    MQ2.init();

    Serial.println("Calibrating MQ2, please wait...");
    float calcR0 = 0;

    for (int i = 0; i < 10; i++) {
        MQ2.update();
        calcR0 += MQ2.calibrate(RatioMQ2CleanAir); // vd: 9.83
        vTaskDelay(500 / portTICK_PERIOD_MS);
    }

    calcR0 /= 10.0;
    MQ2.setR0(calcR0);

    Serial.print("R0 = ");
    Serial.println(calcR0);
}
void readMQ2Gas(void *pvParameters) {
  (void)pvParameters;

  while (1) {
    MQ2.update();
    float lpg = MQ2.readSensor();
    glob_gas = lpg; 

    if (!isnan(lpg)) {
      Serial.print("LPG: ");
      Serial.print(lpg);
      Serial.println(" ppm");
    } else {
      Serial.println("Failed to read MQ2 sensor.");
    }

    vTaskDelay(5000 / portTICK_PERIOD_MS);
  }
}

