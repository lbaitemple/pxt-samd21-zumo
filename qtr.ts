// Add your code here
const QTR_EMITTERS_OFF= 0
const QTR_EMITTERS_ON= 1
const QTR_EMITTERS_ON_AND_OFF = 2

namespace zumo{
    //unsigned char sensorPins[] = { 4, A3, 11, A0, A2, 5 };
    let _pins: DigitalInOutPin[] = [pins.D4, pins.A3, pins.D11, pins.A0, pins.A2, pins.D5];
    let _numSensors = _pins.length;
    let _maxValue = 1023;
    let _err="";
    let _emitterPin = pins.D2;
    let calibratedMinimumOn: number [] =[0,0,0,0,0,0]
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

    function resetCalibration(): void {
        let i: number;
        for (i = 0; i < _numSensors; i++) {
            if (calibratedMinimumOn)
                calibratedMinimumOn[i] = _maxValue;
            if (calibratedMinimumOff)
                calibratedMinimumOff[i] = _maxValue;
            if (calibratedMaximumOn)
                calibratedMaximumOn[i] = 0;
            if (calibratedMaximumOff)
                calibratedMaximumOff[i] = 0;
        }
    }

    function calibrateOnOrOff(
        calibratedMinimum: number[],
        calibratedMaximum: number[],
        readMode: number
    ): void {
        let i: number;
        let sensor_values: number[] = [];
        let max_sensor_values: number[] = [];
        let min_sensor_values: number[] = [];

        // Allocate the arrays if necessary.
        if (!calibratedMaximum) {
            calibratedMaximum = [];
            for (i = 0; i < _numSensors; i++) {
                calibratedMaximum[i] = 0;
            }
        }

        if (!calibratedMinimum) {
            calibratedMinimum = [];
            for (i = 0; i < _numSensors; i++) {
                calibratedMinimum[i] = _maxValue;
            }
        }

        let j: number;
        for (j = 0; j < 10; j++) {
            read(sensor_values, readMode);
            for (i = 0; i < _numSensors; i++) {
                // set the max we found THIS time
                if (j === 0 || max_sensor_values[i] < sensor_values[i]) {
                    max_sensor_values[i] = sensor_values[i];
                }

                // set the min we found THIS time
                if (j === 0 || min_sensor_values[i] > sensor_values[i]) {
                    min_sensor_values[i] = sensor_values[i];
                }
            }
        }

        // record the min and max calibration values
        for (i = 0; i < _numSensors; i++) {
            if (min_sensor_values[i] > calibratedMaximum[i]) {
                calibratedMaximum[i] = min_sensor_values[i];
            }
            if (max_sensor_values[i] < calibratedMinimum[i]) {
                calibratedMinimum[i] = max_sensor_values[i];
            }
        }
    }
    function read(sensor_values: number[], readMode: number): void {
        let off_values: number[] = [];
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

    function readCalibrated(sensor_values: number[], readMode: number): void {
        let i: number;

        // if not calibrated, do nothing
        if (
            (readMode === QTR_EMITTERS_ON_AND_OFF || readMode === QTR_EMITTERS_OFF) &&
            (!calibratedMinimumOff || !calibratedMaximumOff)
        ) {
            _err ="err1";
            return;
        }

        if (
            (readMode === QTR_EMITTERS_ON_AND_OFF || readMode === QTR_EMITTERS_ON) &&
            (!calibratedMinimumOn || !calibratedMaximumOn)
        ) {
            _err = "err2";
            return;
        }

        // read the needed values
        read(sensor_values, readMode);

        for (i = 0; i < _numSensors; i++) {
            let calmin: number, calmax: number;
            let denominator: number;

            // find the correct calibration
            if (readMode === QTR_EMITTERS_ON) {
                calmax = calibratedMaximumOn[i];
                calmin = calibratedMinimumOn[i];
            } else if (readMode === QTR_EMITTERS_OFF) {
                calmax = calibratedMaximumOff[i];
                calmin = calibratedMinimumOff[i];
            } else {
                if (calibratedMinimumOff[i] < calibratedMinimumOn[i]) {
                    // no meaningful signal
                    calmin = _maxValue;
                } else {
                    calmin = calibratedMinimumOn[i] + _maxValue - calibratedMinimumOff[i]; // this won't go past _maxValue
                }

                if (calibratedMaximumOff[i] < calibratedMaximumOn[i]) {
                    // no meaningful signal
                    calmax = _maxValue;
                } else {
                    calmax = calibratedMaximumOn[i] + _maxValue - calibratedMaximumOff[i]; // this won't go past _maxValue
                }
            }

            denominator = calmax - calmin;

            let x: number = 0;
            if (denominator !== 0) {
                x = (((sensor_values[i] as number) - calmin) * 1000) / denominator;
            }
            if (x < 0) {
                x = 0;
            } else if (x > 1000) {
                x = 1000;
            }
            sensor_values[i] = x;
        }
        _err = "no err";
    }

    function emittersOff(): void {
        _emitterPin.digitalWrite(false);
        control.waitMicros(200);
    }

    function emittersOn(): void {
        _emitterPin.digitalWrite(true);
        control.waitMicros(200);
    }

    //% blockId=MKLsensor
    //% block="read Light Value"
    //% subcategory=Light
    export function readLine(): number[]{
        let sensor_values: number[] = [];
        let readMode: number = QTR_EMITTERS_ON_AND_OFF;

        readCalibrated(sensor_values, readMode);
        return sensor_values;
    }

    //% blockId=MKLerrormsg
    //% block="error msg"
    //% subcategory=Light
    export function showerr(): string {
        
        return _err;
    }
    //% blockId=MKLsensorstring
    //% block="read Light $value in String"
    //% subcategory=Light
    export function readString(value: number[]): string {
        
        let result: string = "";
        for (let i = 0; i < value.length; i++) {
            result += value[i].toString();
            if (i < value.length - 1) {
                result += ",";
            }
        }
        return result;
    }
}