
/**
* Marc Felip
* May, 28 2020
*from Adafruit original Lib included in Arduino Lib
tested in BMP085 and micro:bit during 3 days
**********************************************************
* Andrés Sabas @ The Inventor's House
* https://github.com/sabas1080
* January 12, 2018
* https://github.com/sabas1080/uBit_BMP085
* Development environment specifics:
* Written in Microsoft PXT
* Tested with a BMP085 for micro:bit
*
* This code is released under the [MIT License](http://opensource.org/licenses/MIT).
* Please review the LICENSE.BMP085_CAL_MD file included with this example. If you have any questions
* or concerns with licensing, please contact s@theinventorhouse.org.
* Distributed as-is; no warranty is given.
*/

enum bmp_bmpmode {
    ULTRALOWPOWER = 0,
    STANDARD = 1,
    HIGHRES = 2,
    ULTRAHIGHRES = 3
}

enum true_table {
    On = 1,
    Off = 0
}

//% color=#27b0ba weight=100 icon="\uf043" advanced=true
namespace bmp085 {

    let BMP085_DEBUG = false

    const BMP085_I2CADDR = 0x77

    const BMP085_ULTRALOWPOWER = 0
    const BMP085_STANDARD = 1
    const BMP085_HIGHRES = 2
    const BMP085_ULTRAHIRES = 3

    // BMP Compensation Parameter Addresses
    const BMP085_CAL_AC1 = 0xAA
    const BMP085_CAL_AC2 = 0xAC
    const BMP085_CAL_AC3 = 0xAE
    const BMP085_CAL_AC4 = 0xB0
    const BMP085_CAL_AC5 = 0xB2
    const BMP085_CAL_AC6 = 0xB4
    const BMP085_CAL_B1 = 0xB6
    const BMP085_CAL_B2 = 0xB8
    const BMP085_CAL_MB = 0xBA
    const BMP085_CAL_MC = 0xBC
    const BMP085_CAL_MD = 0xBE

    const BMP085_CONTROL = 0xF4
    const version = 0xD1
    const chip_id = 0xD0
    const BMP085_PRESSUREDATA = 0xF6
    const BMP085_TEMPDATA = 0xF6
    const BMP085_READTEMPCMD = 0x2E
    const BMP085_READPRESSURECMD = 0x34

    const chipID = 0X0D
    const sealevelPressure = 101325


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
    let p = 0

    let oversampling = 0



    // Buffer to hold pressure compensation values to pass to the C++ compensation function
    let regPBuf: Buffer

    /***************************************************************************************
    * Functions for interfacing with the BME085
    ***************************************************************************************/

    /** beginBMP085 - The sampling rate mode (ultra low power, standard, high, ultra high resolution) can be seleted by the variable
      * SelectModeBmp (0,1,2,3), default: 0
      */

    //% weight=45 blockGap=1 blockId="beginBMP085" block="beginBMP085 with precission %value"
    export function beginBMP085(value: bmp_bmpmode): void {
        oversampling = value

        // Get the NVM digital compensation number from the device
        ac1Val = read8(BMP085_CAL_AC1, NumberFormat.Int16BE);
        ac2Val = read8(BMP085_CAL_AC2, NumberFormat.Int16BE);
        ac3Val = read8(BMP085_CAL_AC3, NumberFormat.Int16BE);
        ac4Val = read8(BMP085_CAL_AC4, NumberFormat.UInt16BE);
        ac5Val = read8(BMP085_CAL_AC5, NumberFormat.UInt16BE);
        ac6Val = read8(BMP085_CAL_AC6, NumberFormat.UInt16BE);
        b1Val = read8(BMP085_CAL_B1, NumberFormat.Int16BE);
        b2Val = read8(BMP085_CAL_B2, NumberFormat.Int16BE);
        mbVal = read8(BMP085_CAL_MB, NumberFormat.Int16BE);
        mcVal = read8(BMP085_CAL_MC, NumberFormat.Int16BE);
        mdVal = read8(BMP085_CAL_MD, NumberFormat.Int16BE);

        if (BMP085_DEBUG) {
            //Variable Debug datasheet value
            ac1Val = 408
            ac2Val = -72
            ac3Val = -14383
            ac4Val = 32741
            ac5Val = 32757
            ac6Val = 23153
            b1Val = 6190
            b2Val = 4
            mbVal = -32768
            mcVal = -8711
            mdVal = 2868
        }
    }

    function computeB5(UT: number) {
        let X1 = (UT - ac6Val) * (ac5Val) >> 15;
        let X2 = (mcVal << 11) / (X1 + mdVal);
        return X1 + X2;
    }

    //% subcategory=Maintenance
	//% weight=45 blockGap=8 blockId="readRawTemperature" block="raw temperature"
    export function readRawTemperature(): number {
        write8(BMP085_CONTROL, BMP085_READTEMPCMD)
        basic.pause(5)
        // Read the temperature registers
        let tempRegM = read16(BMP085_TEMPDATA, NumberFormat.Int16BE)
        //return compensateTemp(tempRegM)
        return tempRegM
    }
    function readRawPressure(): number {
        let raw = 0

        write8(BMP085_CONTROL, BMP085_READPRESSURECMD + (oversampling << 6))

        if (oversampling = BMP085_ULTRALOWPOWER)
            basic.pause(5)
        else if (oversampling = BMP085_STANDARD)
            basic.pause(8)
        else if (oversampling = BMP085_HIGHRES)
            basic.pause(14)
        else
            basic.pause(26)

        raw = read16(BMP085_PRESSUREDATA, NumberFormat.UInt16BE)
        raw <<= 8
        raw |= read8(BMP085_PRESSUREDATA + 2, NumberFormat.UInt8LE)
        raw >>= (8 - oversampling)
        return raw;
    }

    //% weight=42 blockGap=8 blockId="readPressure" block="pressure(Pa)"
    export function readPressure(): number {
        let UT = 0
        let UP = 0
        let B3 = 0
        let B5 = 0
        let B6 = 0
        let X1 = 0
        let X2 = 0
        let X3 = 0
        let p = 0
        let B4 = 0
        let B7 = 0

        UT = readRawTemperature()
        UP = readRawPressure()

        if (BMP085_DEBUG) {
            //Variable Debug datasheet value
            UT = 27898;
            UP = 23843;
            ac6Val = 23153;
            ac5Val = 32757;
            mcVal = -8711;
            mdVal = 2868;
            b1Val = 6190;
            b2Val = 4;
            ac3Val = -14383;
            ac2Val = -72;
            ac1Val = 408;
            ac4Val = 32741;
            oversampling = 0;
        }

        /* presure compensation */
        B5 = computeB5(UT)

        B6 = B5 - 4000;
        X1 = (b2Val * ((B6 * B6) >> 12)) >> 11;
        X2 = (ac2Val * B6) >> 11;
        X3 = X1 + X2;
        B3 = ((((ac1Val) * 4 + X3) << oversampling) + 2) / 4;

        X1 = (ac3Val * B6) >> 13;
        X2 = (b1Val * ((B6 * B6) >> 12)) >> 16;
        X3 = ((X1 + X2) + 2) >> 2;
        B4 = (ac4Val * (X3 + 32768)) >> 15;
        B7 = ((UP - B3) * (50000 >> oversampling));

        if (B7 < 0x80000000) {
            p = (B7 * 2) / B4;
        }
        else {
            p = (B7 / B4) * 2;
        }

        X1 = (p >> 8) * (p >> 8)
        X1 = (X1 * 3038) >> 16
        X2 = (-7357 * p) >> 16

        p = p + ((X1 + X2 + 3791) >> 4)

        /* Assign compensated pressure value */
        return p
    }
    //% weight=45 blockGap=8 blockId="readTemperature" block="temperature(C)"
    export function readTemperature(): number { //
        let UT, B5, temp

        UT = readRawTemperature()

        if (BMP085_DEBUG) {
            // use datasheet numbers!
            UT = 27898;
            ac6Val = 23153;
            ac5Val = 32757;
            mcVal = -8711;
            mdVal = 2868;
        }

        B5 = computeB5(UT)
        temp = (B5 + 4) >> 4
        temp /= 10

        return temp

    }
    function read8(reg: number, format: NumberFormat) {
        pins.i2cWriteNumber(BMP085_I2CADDR, reg, NumberFormat.UInt8LE, false)
        let val = pins.i2cReadNumber(BMP085_I2CADDR, format, false)
        return val
    }

    function read16(reg: number, format: NumberFormat) {
        pins.i2cWriteNumber(BMP085_I2CADDR, reg, NumberFormat.UInt16LE, false)
        let val = pins.i2cReadNumber(BMP085_I2CADDR, format, false)
        return val
    }
	/**
     * Writes a value to a register on the BMP085
     */
    function write8(addr: number, data: number): void {
        pins.i2cWriteNumber(BMP085_I2CADDR, addr << 8 | data, NumberFormat.Int16BE)
    }

    //% subcategory=Maintenance
	//% weight=45 blockGap=8 blockId="debug" block="debug serial %value"
    export function debug(data: true_table): void {
        if (data == 1) {

            BMP085_DEBUG = true
        }
        else {
            BMP085_DEBUG = false
        }
    }
    /**
     * Reads a value from a register on the BMP085
     */



    /**
     * Reads the temp from the BMP sensor and uses compensation for calculator temperature.
     * Returns 4 digit number. Value should be devided by 100 to get DegC
     */
    //% subcategory=Maintenance
	//% weight=45 blockGap=8 blockId="viewVersion" block="version"
    export function getVersion(): number {
        p = read8(version, NumberFormat.UInt16BE)
        return p
    }

    /**
     * Reads the pressure from the BMP sensor and uses compensation for calculating pressure.
     * Returns an 8 digit number. Value should be divided by 25600 to get hPa.
     */


    /**
     * Returns temperature in DegC, resolution is 0.01 DegC. Output value of “5123” equals 51.23 DegC.
     * tFine carries fine temperature as global value
     */



    function compensateTemp(UT: number): number {
        let t = 0

        if (BMP085_DEBUG) {
            //Variable Debug datasheet value
            UT = 27898
        }

        let B5 = computeB5(UT);
        t = (B5 + 8) >> 4;
        t /= 10;
        return t
    }



    /**
    * 
    * Calculates the Altitude based on pressure. 
    */
    //% weight=32 blockGap=8 blockId="altitude" block="altitude"
    export function Altitude(): number {
        let p = readPressure()

        return 44330 * (1 - Math.pow(p / sealevelPressure, 0.1902949));
    }

    export function getSeaLevel(pressure: number, altitude: number): number {
        return pressure / Math.pow(1 - (altitude / 44330), 5.255);
    }

}
