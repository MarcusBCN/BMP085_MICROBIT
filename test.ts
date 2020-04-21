// tests go here; this will not be compiled when this package is used as a library

input.onButtonPressed(Button.B, function () {
    bmp085.debug(true_table.On)
})
input.onButtonPressed(Button.A, function () {
    bmp085.debug(true_table.Off)
})
serial.redirectToUSB()
bmp085.beginBMP085(bmp_bmpmode.ULTRALOWPOWER)
bmp085.debug(true_table.Off)
basic.forever(function () {
    serial.writeString("temp:")
    serial.writeNumber(bmp085.readTemperature())
    serial.writeLine("")
    serial.writeString("pres:")
    serial.writeNumber(bmp085.readPressure() / 100)
    serial.writeLine("hPa")
})
