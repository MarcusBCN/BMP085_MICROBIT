/**
* Andres Sabas @ The Inventor's House
* https://github.com/sabas1080
* January 12, 2018
* https://github.com/
*
* Development environment specifics:
* Written in Microsoft PXT
* Tested with a BMP085:bit for micro:bit
*
* This code is released under the [MIT License](http://opensource.org/licenses/MIT).
* Please review the LICENSE.md file included with this example. If you have any questions
* or concerns with licensing, please contact techsupport@sparkfun.com.
* Distributed as-is; no warranty is given.
*/


#include "pxt.h"

namespace bmp085 {

/*
* Compensates the pressure value read from the register.  This done in C++ because
* it requires the use of 64-bit signed integers which isn't provided in TypeScript
*/
//%
int32_t compensatePressure(int16_t b5, int16_t up, Buffer compensation) {
    int32_t  x1, x2, b6, x3, b3, p;
    uint32_t b4, b7;

     // Create a managed buffer out of the packet compensation data
     ManagedBuffer comp(compensation);

     // Compensation Values
        int16_t ac1Val; //ER
        int16_t ac2Val;
        int16_t ac3Val;
        uint16_t ac4Val;
        uint16_t ac5Val;
        uint16_t ac6Val;
        int16_t b1Val;
        int16_t b2Val;
        int16_t mbVal;
        int16_t mcVal;
        int16_t mdVal;
        int8_t bmpMode;

        // Unpack the compensation data
        comp.readBytes((uint8_t *) &ac1Val, 0, 2);
        comp.readBytes((uint8_t *) &ac2Val, 2, 2);
        comp.readBytes((uint8_t *) &ac3Val, 4, 2);
        comp.readBytes((uint8_t *) &ac4Val, 6, 2);
        comp.readBytes((uint8_t *) &ac5Val, 8, 2);
        comp.readBytes((uint8_t *) &ac6Val, 10, 2);
        comp.readBytes((uint8_t *) &b1Val, 12, 2);
        comp.readBytes((uint8_t *) &b2Val, 14, 2);
        comp.readBytes((uint8_t *) &mbVal, 16, 2);
        comp.readBytes((uint8_t *) &mcVal, 18, 2);
        comp.readBytes((uint8_t *) &mdVal, 20, 2);
        comp.readBytes((uint8_t *) &bmpMode, 22, 2);

    /* Pressure compensation */
    b6 = b5 - 4000;
    x1 = ((int32_t)b2Val * ((b6 * b6) >> 12)) >> 11;
    x2 = ((int32_t)ac2Val * b6) >> 11;
    x3 = x1 + x2;
    b3 = (((((int32_t)ac1Val) * 4 + x3) << bmpMode) + 2) >> 2;
    x1 = ((int32_t)ac3Val * b6) >> 13;
    x2 = ((int32_t)b1Val * ((b6 * b6) >> 12)) >> 16;
    x3 = ((x1 + x2) + 2) >> 2;
    b4 = ((uint32_t)ac4Val * (uint32_t) (x3 + 32768)) >> 15;
    b7 = (((uint32_t)up - b3) * (uint32_t)(50000UL >> bmpMode));

    if (b7 < 0x80000000)
    {
      p = (b7 << 1) / b4;
    }
    else
    {
      p = (b7 / b4) << 1;
    }
    
    return p;
}

  /*
  * calculates the Altitude based on pressure. 
  */
  //%    
  uint32_t calcAltitude(int32_t p) {     
    return 44330*(1-pow(((p/25600)/1013.25), 0.1903));
  }

}
