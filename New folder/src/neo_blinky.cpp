#include "neo_blinky.h"

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos, Adafruit_NeoPixel &strip)
{
    WheelPos = 255 - WheelPos;
    if (WheelPos < 85)
    {
        return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
    }
    if (WheelPos < 170)
    {
        WheelPos -= 85;
        return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
    }
    WheelPos -= 170;
    return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

void rainbowCycle(Adafruit_NeoPixel &strip, uint8_t wait)
{
    uint16_t i, j;

    for (j = 0; j < 256; j++)
    { // 1 cycle of all colors on wheel
        for (i = 0; i < strip.numPixels(); i++)
        {
            strip.setPixelColor(i, Wheel(((i * 256 / strip.numPixels()) + j) & 255, strip));
        }
        strip.show();
        vTaskDelay(pdMS_TO_TICKS(wait));
    }
}

void neo_blinky(void *pvParameters)
{

    Adafruit_NeoPixel strip(LED_COUNT, NEO_PIN, NEO_GRB + NEO_KHZ800);
    strip.begin();
    // Set all pixels to off to start
    strip.clear();
    strip.show();
    while (1)
    {
        if(glob_led_NEO == false)
        {
            strip.clear();
            strip.show();
            vTaskDelay(100);
            continue;
        }
        // change the color slowly from red to green to blue
        rainbowCycle(strip, 30); // 20ms delay for smooth animation

        // Wait for another 500 milliseconds
        // vTaskDelay(1000);
    }
}