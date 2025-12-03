#include "lightsensor.h"
#include "global.h"


static int   s_lightRaw     = 0;
static float s_lightPercent = 0.0f;

void initLightSensor() {
    pinMode(LIGHT_SENSOR_PIN, INPUT);
}

void readLightSensor() {
    s_lightRaw = analogRead(LIGHT_SENSOR_PIN);
    s_lightPercent = (s_lightRaw / 4095.0f) * 100.0f;
    s_lightPercent = roundf(s_lightPercent * 10.0f) / 10.0f;
    glob_light = s_lightPercent;
}

// 🔹 HÀM TASK ĐÚNG CHUẨN FREERTOS
void readLightSensorTask(void *pvParameters) {
    (void) pvParameters;
    Serial.begin(115200); 

    initLightSensor();   // init 1 lần

    while (1) {
        readLightSensor();   // đọc & cập nhật glob_light

        // debug nếu muốn
        Serial.print("Light: ");
        Serial.print(glob_light);
        Serial.println(" %");

        vTaskDelay(5000 / portTICK_PERIOD_MS);   // 1s/lần
    }
}
