/**
* Andrés Sabas @ The Inventor's House
* https://github.com/sabas1080
* January 12, 2018
* https://github.com/
* Development environment specifics:
* Written in Microsoft PXT
* Tested with a BMP085 for micro:bit
*
* This code is released under the [MIT License](http://opensource.org/licenses/MIT).
* Please review the LICENSE.md file included with this example. If you have any questions
* or concerns with licensing, please contact s@theinventorhouse.org.
* Distributed as-is; no warranty is given.
*/
namespace bmp085{
  /**
  * Functions used for simulator, actual implementation is in BMP085.cpp
  */
  /**

   * Reads the temp from the BMP sensor and uses compensation for calculator temperature.
   */
  //% weight=43 blockGap=8 blockId="bmp085_temperature" block="temperature(C)"
  //% shim=bmp085::getTemperature
  export function temperature(): number {
    // Fake function for simulator
    return 0
  }

  /**
     * Reads the pressure from the BMP sensor and uses compensation for calculating pressure.
     */
    //% weight=43 blockGap=8 blockId="bmp085_pressure" block="pressure"
    //% shim=bmp085::getPressure
    export function pressure(): number {
        // Fake function for simulator
        return 0
    }
}
