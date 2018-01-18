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

   let bmpMode = 0

   // Buffer to hold pressure compensation values to pass to the C++ compensation function
   let regPBuf: Buffer

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
  //% weight=45 blockGap=8 blockId="temperature" block="temperature(C)"
  export function temperature(): number {
      // Read the temperature registers
      let tempRegM = readBMEReg(tempData, NumberFormat.UInt16BE)

      // Use compensation formula and return result
      return compensateTemp(tempRegM)
  }

   /**
   * The sampling rate mode (ultra low power, standard, high, ultra high resolution) can be seleted by the variable
   * SelectModeBmp (0,1,2,3), default: 0
   */
  //% weight=45 blockGap=8 blockId="SelecBMPMode" block="SelectBMPMode %value"
export function selectBmpMode(value: number): void {
    bmpMode = value
}

  /**
   * Reads the pressure from the BMP sensor and uses compensation for calculating pressure.
   * Returns an 8 digit number. Value should be divided by 25600 to get hPa.
   */
  //% weight=42 blockGap=8 blockId="pressure" block="pressure"
  export function pressure(): number {
    let p8 = 0
    let p16 = 0
    let up = 0
    let UT = 0
    let b3 =0 
    let b4 = 0 
    let b5 = 0
    let b6 = 0
    let b7 = 0
    let x1 = 0
    let x2 = 0 
    let x3 = 0
    let p = 0
    let compp = 0

     /* Get the raw pressure and temperature values */
     UT = readBMEReg(tempData, NumberFormat.UInt16BE)

     //UT = 27898;

      WriteBMEReg(ctrl, readPressCMD + (bmpMode << 6))
      basic.pause(5)
      p16 = readBMEReg(pressData, NumberFormat.UInt16BE)
      up = p16 << 8
      p8 = readBMEReg(pressData+2, NumberFormat.UInt8LE)
      up += p8
      up >>= (8 - bmpMode)

      /* Temperature compensation */
    b5 = computeB5(UT)

    p = compensatePressure(b5, up, regPBuf)

    x1 = (p >> 8) * (p >> 8);
    x1 = (x1 * 3038) >> 16;
    x2 = (-7357 * p) >> 16;
    compp = p + ((x1 + x2 + 3791) >> 4);

    /* Assign compensated pressure value */
    return compp;
  }

  /**
   * Returns temperature in DegC, resolution is 0.01 DegC. Output value of “5123” equals 51.23 DegC.
   * tFine carries fine temperature as global value
   */
  function compensateTemp(UT: number): number {
      let t = 0

      let B5 = computeB5(UT);
      t = (B5+8) >> 4;
      t /= 10;
      return t
  }

function computeB5(UT: number) {
  // Get the NVM digital compensation number from the device
  ac1Val = readBMEReg(ac1, NumberFormat.UInt16BE);
  ac2Val = readBMEReg(ac2, NumberFormat.UInt16BE);
  ac3Val = readBMEReg(ac3, NumberFormat.UInt16BE);
  ac4Val = readBMEReg(ac4, NumberFormat.UInt16BE);
  ac5Val = readBMEReg(ac5, NumberFormat.UInt16BE);
  ac6Val = readBMEReg(ac6, NumberFormat.UInt16BE);
  b1Val = readBMEReg(b1, NumberFormat.UInt16BE);
  b2Val = readBMEReg(b2, NumberFormat.UInt16BE);
  mbVal = readBMEReg(mb, NumberFormat.UInt16BE);
  mcVal = readBMEReg(mc, NumberFormat.UInt16BE);
  mdVal = readBMEReg(md, NumberFormat.UInt16BE);

  // Instantiate buffer that holds the pressure compensation values
  regPBuf = pins.createBuffer(24)

  // Get the NVM digital compensation number from the device for pressure and pack into
  // a buffer to pass to the C++ implementation of the compensation formula
  regPBuf.setNumber(NumberFormat.UInt16LE, 0, readBMEReg(ac1, NumberFormat.UInt16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 2, readBMEReg(ac2, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 4, readBMEReg(ac3, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 6, readBMEReg(ac4, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 8, readBMEReg(ac5, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 10, readBMEReg(ac6, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 12, readBMEReg(b1, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 14, readBMEReg(b2, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 16, readBMEReg(mb, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 18, readBMEReg(mc, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 20, readBMEReg(md, NumberFormat.Int16LE))
  regPBuf.setNumber(NumberFormat.Int16LE, 22, bmpMode)  


  let X1 = (UT - ac6Val) * (ac5Val) >> 15;
  let X2 = (mcVal << 11) / (X1 + mdVal);
  return X1 + X2;
}

/**
 * Function used for simulator, actual implementation is in bmp085.cpp
*/
//% shim=bmp085::compensatePressure
function compensatePressure(b5: number, up: number, regPBuf: Buffer) {
    // Fake function for simulator
    return 0
}

/**
 * Function used for simulator, actual implementation is in bmp085.cpp
*/
//% shim=bmp085::calcAltitude
function calcAltitude(p: number ) {
    // Fake function for simulator
    return 0
}

/**
* 
* Calculates the Altitude based on pressure. 
*/
//% weight=32 blockGap=8 blockId="altitude" block="altitude"
export function Altitude(): number {
    let up = 0
    let UT = 0
    let p16 = 0
    let p8 = 0 
    let b5 = 0
    let p = 0

    /* Get the raw pressure and temperature values */
    UT = readBMEReg(tempData, NumberFormat.UInt16BE)

    /* Temperature compensation */
    b5 = computeB5(UT)

    WriteBMEReg(ctrl, readPressCMD + (bmpMode << 6))
    basic.pause(5)
    p16 = readBMEReg(pressData, NumberFormat.UInt16BE)
    up = p16 << 8
    p8 = readBMEReg(pressData+2, NumberFormat.UInt8LE)
    up += p8
    up >>= (8 - bmpMode)
    p = compensatePressure(b5, up, regPBuf)
    return calcAltitude(p)
}

}
