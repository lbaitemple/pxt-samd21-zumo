// Add your code here
//const QTR_EMITTERS_OFF = 0
//const QTR_EMITTERS_ON = 1
//const QTR_EMITTERS_ON_AND_OFF = 2

namespace zumo {

    let _pins: DigitalInOutPin[] = [pins.D4, pins.A3, pins.D11, pins.A0, pins.A2, pins.D5];
    //let _apins: AnalogInOutPin[] = [pins.A0, pins.A1];
    let _numSensors = _pins.length;
    let _numSamplesPerSensor = 4;
    let _maxValue = 1023;
    let _lastValue = 0;
    let _err = "";
    let _emitterPin = pins.D2;
    let calibratedMinimumOn: number[] = [0, 0, 0, 0, 0, 0]
    let calibratedMaximumOn: number[] = [0, 0, 0, 0, 0, 0]
    let calibratedMinimumOff: number[] = [0, 0, 0, 0, 0, 0]
    let calibratedMaximumOff: number[] = [0, 0, 0, 0, 0, 0]
    
    function readPrivate(sensor_values: number[]): void {
        let i: number;

        if (!_pins)
            return;

        for (i = 0; i < _numSensors; i++) {
            sensor_values[i] = _maxValue;
            _pins[i].digitalWrite(true);
            _pins[i].setPull(PinPullMode.PullNone);
        }

        control.waitMicros(10);   // charge lines for 10 us

        for (i = 0; i < _numSensors; i++) {
            _pins[i].digitalWrite(false);
        }

        let startTime = control.micros();
        while (control.micros() - startTime < _maxValue) {
            let time = control.micros() - startTime;
            for (i = 0; i < _numSensors; i++) {
                if (_pins[i].digitalRead() == false && time < sensor_values[i])
                    sensor_values[i] = time;
            }
        }
    }

    function emittersOff(): void {
        _emitterPin.digitalWrite(false);
        control.waitMicros(200);
    }

    function emittersOn(): void {
        _emitterPin.digitalWrite(true);
        control.waitMicros(200);
    }

    function read(sensor_values: number[], readMode: number): void {
        let off_values: number[] = [];
        for (let i = 0; i < _numSensors; i++) {
            off_values.push(0);
        }
    
        let i: number;

        if (readMode === QTR_EMITTERS_ON || readMode === QTR_EMITTERS_ON_AND_OFF)
            emittersOn();
        else
            emittersOff();

        readPrivate(sensor_values);
        emittersOff();

        if (readMode === QTR_EMITTERS_ON_AND_OFF) {
            readPrivate(off_values);

            for (i = 0; i < _numSensors; i++) {
                sensor_values[i] += _maxValue - off_values[i];
            }
        }
    }


}
