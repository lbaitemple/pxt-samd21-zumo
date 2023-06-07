input.buttonD12.onEvent(ButtonEvent.Click, function () {
    pause(500)
    while (!(input.buttonD12.isPressed())) {
        zumo.clear()
        zumo.writeStringNewLine(zumo.readString(zumo.calibratedMaximumOn_values()))
        zumo.writeStringNewLine(zumo.readString(zumo.calibratedMinimumOn_values()))
        sensors = zumo.readLine()
        zumo.writeNumNewLine(zumo.getLineNumber())
        zumo.writeStringNewLine(zumo.readString(sensors))
        pause(1000)
    }
})
let sensors: number[] = []
zumo.createI2C(pins.SCL, pins.SDA)
zumo.init(128, 64)
zumo.enableIMU()
zumo.Initialization()
zumo.writeStringNewLine("ready")
zumo.writeStringNewLine(zumo.Showerr())

