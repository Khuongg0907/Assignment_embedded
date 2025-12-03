#include "led_blinky.h"

void led_blinky(void *pvParameters)
{
    pinMode(LED_GPIO, OUTPUT);
    int count = 0;

    while (1)
    {
        if (glob_led_D3 == false)
        {
            digitalWrite(LED_GPIO, LOW); // turn the LED OFF
        }
        else
        {
            switch (count)
            {
            case 2:
                count = 0;
            case 0:
                digitalWrite(LED_GPIO, LOW); // turn the LED OFF
                count++;
                break;
            case 1:
                digitalWrite(LED_GPIO, HIGH); // turn the LED ON
                count++;
                break;
            default:
                break;
            }
        }
        vTaskDelay(1000);
    }
}