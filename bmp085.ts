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
  // BMP085 Addresses
  const bmpAddr = 0x77
  const ctrl = 0xF4
  const pressData = 0xF6
  const tempData = 0xF6
  const readTempCMD = 0x2E
  const readPressCMD = 0x34

  // BMP Compensation Parameter Addresses
  const ac1 = 0xAA
  const ac2 = 0xAC
  const ac3 = 0xAE
  const ac4 = 0xB0
  const ac5 = 0xB2
  const ac6 = 0xB4
  const b1 = 0xB6
  const b2 = 0xB8
  const mb = 0xBA
  const mc = 0xBC
  const md = 0xBE

 // Stores compensation values
   let ac1Val = 0
   let ac2Val = 0
   let ac3Val = 0
   let ac4Val = 0
   let ac5Val = 0
   let ac6Val = 0
   let b1Val = 0
   let b2Val = 0
   let mbVal = 0
   let mcVal = 0
   let mdVal = 0

 /***************************************************************************************
 * Functions for interfacing with the BME085
 ***************************************************************************************/

  /**
   * Writes a value to a register on the BMP085
   */
  function WriteBMEReg(reg: number, val: number): void {
      pins.i2cWriteNumber(bmpAddr, reg << 8 | val, NumberFormat.Int16BE)
  }
  /**
   * Reads a value from a register on the BMP085
   */

  function readBMEReg(reg: number, format: NumberFormat) {
      pins.i2cWriteNumber(bmpAddr, reg, NumberFormat.UInt8LE, false)
      let val = pins.i2cReadNumber(bmpAddr, format, false)
      return val
  }

  /**
   * Reads the temp from the BMP sensor and uses compensation for calculator temperature.
   * Returns 4 digit number. Value should be devided by 100 to get DegC
   */
  //% weight=43 blockGap=8 blockId="weatherbit_temperature" block="temperature(C)"
  export function temperature(): number {
      // Read the temperature registers
      let tempRegM = readBMEReg(tempData, NumberFormat.UInt16BE)

      // Use compensation formula and return result
      return compensateTemp(tempRegM)
  }

  /**
   * Reads the pressure from the BMP sensor and uses compensation for calculating pressure.
   * Returns an 8 digit number. Value should be divided by 25600 to get hPa.
   */
  //% weight=42 blockGap=8 blockId="pressure" block="pressure"
/*
  export function pressure(): number {
      // Read the temperature registers
      let pressRegM = readBMEReg(pressMSB, NumberFormat.UInt16BE)
      let pressRegL = readBMEReg(pressXlsb, NumberFormat.UInt8LE)

      // Compensate and return pressure
      return compensatePressure((pressRegM << 4) | (pressRegL >> 4), tFine, digPBuf)
  }
*/
  /**
   * Returns temperature in DegC, resolution is 0.01 DegC. Output value of “5123” equals 51.23 DegC.
   * tFine carries fine temperature as global value
   */
  function compensateTemp(UT: number): number {
      let t = 0

      // Get the NVM digital compensation number from the device
      ac1Val = readBMEReg(ac1, NumberFormat.UInt16BE);
      ac2Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      ac3Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      ac4Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      ac5Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      ac6Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      b1Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      b2Val = readBMEReg(ac2, NumberFormat.UInt16BE);
      mbVal = readBMEReg(ac2, NumberFormat.UInt16BE);
      mcVal = readBMEReg(ac2, NumberFormat.UInt16BE);
      mdVal = readBMEReg(ac2, NumberFormat.UInt16BE);

      let B5 = computeB5(UT);
      t = (B5+8) >> 4;
      t /= 10;
      return t
  }

function computeB5(UT: number) {
  let X1 = (UT - ac6Val) * (ac5Val) >> 15;
  let X2 = (mcVal << 11) / (X1+mdVal);
  return X1 + X2;
}

}
