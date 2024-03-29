// Add your code here
const QTR_EMITTERS_OFF = 0
const QTR_EMITTERS_ON = 1
const QTR_EMITTERS_ON_AND_OFF = 2
const QTR_MAX_SENSORS = 16
enum Lightype {
    DIGITAL,
    ANALOG
}

namespace zumo {

//    let _pins: DigitalInOutPin[] = [pins.D4, pins.A3, pins.D11, pins.A0, pins.A2, pins.D5];
//    let _pins: DigitalInOutPin[] = [pins.D5, pins.A2,  pins.A3, pins.D4];
    let _pins: DigitalInOutPin[] = [pins.D4, pins.A3, pins.D11, pins.A2, pins.D5];
    let _apins: AnalogInOutPin[] = [pins.A0, pins.A1];
    let _numSensors = _pins.length;
    let _numSamplesPerSensor = 4;
    let _maxValue = 2000; 
    let _line = 0;
    let _sensorType = Lightype.DIGITAL
    let _init = true;  // when _init = true, not set any signal to A0 - buzzer
    let _lastValue = 0;
    let _err = "", _err1="";
    let _emitterPin = pins.D2;
    let calibratedMinimumOn: number[] = [0, 0, 0, 0, 0 ]
    let calibratedMaximumOn: number[] = [0, 0, 0, 0, 0]
    let calibratedMinimumOff: number[] = [0, 0, 0, 0, 0]
    let calibratedMaximumOff: number[] = [0, 0, 0, 0, 0]
    let whiteLine = 0;
    
    //% block="Initialization $type Light Sensors"
    //% type.defl = Lightype.DIGITAL
    //% subcategory=Light
    //% group="Initialization"
    export function Initialization(type:Lightype = Lightype.DIGITAL): void {

        _init = true;
        let i: number;

        _sensorType = type
        if (type===Lightype.DIGITAL){
            _numSensors = _pins.length;
            _maxValue = 2000;
        }
        else{
            _numSensors = _apins.length;
            _maxValue = 1023;
        }
        calibratedMinimumOn = initializeArrayWithZeros(_numSensors)
        calibratedMaximumOn = initializeArrayWithZeros(_numSensors)
        calibratedMinimumOff = initializeArrayWithZeros(_numSensors)
        calibratedMaximumOff = initializeArrayWithZeros(_numSensors)
        // delay 500 ms
        control.waitMicros(500000);
        let startTime: number = control.millis();
        while (control.millis() - startTime < 10000) {
            calibrate(QTR_EMITTERS_ON);
        }
        _init = false;
    }

    //% block="show calibratedMinimumOn values"
    //% subcategory=Light
    //% group="calibration"
    export function calibratedMinimumOn_values(): number [] {
        return calibratedMinimumOn;
    }

    //% block="show calibratedMaximumOn values"
    //% subcategory=Light
    //% group="calibration"
    export function calibratedMaximumOn_values(): number[] {
        return calibratedMaximumOn;
    }


    //% block="read Light Number"
    //% subcategory=Light
    //% group="Functions"
    export function getLineNumber(): number {
        return _line;
    }

    //% block="read sensor_values $value as a string"
    //% subcategory=Light
    //% group="Functions"
    export function readString(value: number[]): string {
        let result: string = "";
        for (let i = 0; i < value.length; i++) {
            result += value[i].toString();
            if (i < value.length - 1) {
                result += ", ";
            }
        }
        return result;
    }

    //% block="read Line "
    //% subcategory=Light
    //% group="Functions"
    export function readLine(): number [] {
        let sensor_values: number[] = [];
        let onLine = 0 ;
        let readMode: number = QTR_EMITTERS_ON;

        sensor_values = initializeArrayWithZeros(_numSensors)
        
        readCalibrated(sensor_values, readMode);
        let avg: number = 0;
        let sum: number = 0;
        let i: number = 0;

        for (i = 0; i < _numSensors; i++) {
            let value = sensor_values[i];
            if (whiteLine)
                value =1000- value ;

            // keep track of whether we see the line at all
            if (value > 200) {
                onLine = 1;
            }

            // only average in values that are above a noise threshold
            if (value > 50) {
                avg += value * (i * 1000);
                sum += value;
            }
        }

        if (!onLine) {
            // If it last read to the left of center, return 0.
            if (_lastValue < (_numSensors - 1) * 1000 / 2)
                _line =  0;

            // If it last read to the right of center, return the max.
            else
                _line =  (_numSensors - 1) * 1000;
        }

        _lastValue = Math.idiv(avg, sum);
        _line = _lastValue;
        return sensor_values;
    }

    function initializeArrayWithZeros(n: number): number[] {
        const zerosArray: number[] = [];
        for (let i = 0; i < n; i++) {
            zerosArray.push(0);
        }
        return zerosArray;
    }

    function readCalibrated(sensor_values: number[], readMode: number = QTR_EMITTERS_ON, sensor: Lightype =Lightype.DIGITAL ): void {
        let i: number;

        // if not calibrated, do nothing
        if (
            (readMode === QTR_EMITTERS_ON_AND_OFF || readMode === QTR_EMITTERS_OFF) &&
            (!calibratedMinimumOff || !calibratedMaximumOff)
        ) {
            return;
        }

        if (
            (readMode === QTR_EMITTERS_ON_AND_OFF || readMode === QTR_EMITTERS_ON) &&
            (!calibratedMinimumOn || !calibratedMaximumOn)
        ) {
            return;
        }

        // read the needed values
        read(sensor_values, readMode);

        for (i = 0; i < _numSensors; i++) {
            let calmin: number, calmax: number;
            let denominator: number;

            // find the correct calibration
            if (readMode == QTR_EMITTERS_ON) {
                calmax = calibratedMaximumOn[i];
                calmin = calibratedMinimumOn[i];
            } else if (readMode == QTR_EMITTERS_OFF) {
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
            if (denominator != 0) {
                x = (((sensor_values[i] as number) - calmin) * 1000) / denominator;
                //x = Math.idiv(((sensor_values[i] as number) - calmin) * 1000, denominator)
            }
            if (x < 0) {
                //    _err ="here "
                x = 0;
            } else if (x > 1000) {
                x = 1000;
                //    _err="big";
            }
            sensor_values[i] = x;
            //_err = _err + "; nogood   " + `${x}`
        }

    }


    function readPrivate(sensor_values: number[]): void {
        let i: number;

        for (i = 0; i < _numSensors; i++) {
            sensor_values[i] = _maxValue;
            _pins[i].digitalWrite(true);
        }
        
        control.waitMicros(10);   // charge lines for 10 us
        let time: number = 0;
        let startTime = control.micros()

        for (i = 0; i < _numSensors; i++) {
        }
        // make it nothing runInParallel

        while (time < _maxValue) {
            time = control.micros() - startTime;
            for (i = 0; i < _numSensors; i++) {
                if (_pins[i].digitalRead() === false && time < sensor_values[i]){
                    sensor_values[i] = time;
                }
            }
        }
        
    }


    function readAnalogPrivate(sensor_values: number[]): void {
        if (_apins === null) {
            return;
        }

        // Reset the values
        for (let i = 0; i < _numSensors; i++) {
            sensor_values[i] = 0;
        }

        for (let j = 0; j < _numSamplesPerSensor; j++) {
            for (let i = 0; i < _numSensors; i++) {
                sensor_values[i] += _apins[i].analogRead();// Add the conversion result
            }
        }

        // Get the rounded average of the readings for each sensor
        for (let i = 0; i < _numSensors; i++) {
            sensor_values[i] = Math.round(sensor_values[i] / _numSamplesPerSensor);
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

        off_values = initializeArrayWithZeros(QTR_MAX_SENSORS);
        let i: number;

        if (readMode == QTR_EMITTERS_ON || readMode === QTR_EMITTERS_ON_AND_OFF)
            emittersOn();
        else
            emittersOff();

        if (_sensorType == Lightype.DIGITAL){
            readPrivate(sensor_values);
        }
        else{
            readAnalogPrivate(sensor_values);
        }
        emittersOff();

        if (readMode == QTR_EMITTERS_ON_AND_OFF) {
            if (_sensorType == Lightype.DIGITAL) {
                readPrivate(off_values);
            }
            else {
                readAnalogPrivate(off_values);
            }
            for (i = 0; i < _numSensors; i++) {
                sensor_values[i] += _maxValue - off_values[i];
            }
        }
    }


    function calibrate(readMode: number): void {
        if (readMode === QTR_EMITTERS_ON_AND_OFF || readMode === QTR_EMITTERS_ON) {
            calibrateOnOrOff(calibratedMinimumOn, calibratedMaximumOn, QTR_EMITTERS_ON);            
        }

        if (readMode === QTR_EMITTERS_ON_AND_OFF || readMode === QTR_EMITTERS_OFF) {
            calibrateOnOrOff(calibratedMinimumOff, calibratedMaximumOff, QTR_EMITTERS_OFF);
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

    function calibrateOnOrOff(calibratedMinimum: number[], calibratedMaximum: number[], readMode: number): void {
        let i: number;
        let sensor_values: number[] = [];
        let max_sensor_values: number[] = [];
        let min_sensor_values: number[] = [];

        // Allocate the arrays if necessary.
        for (i = 0; i < _numSensors; i++) {
            calibratedMaximum[i] = 0;
            calibratedMinimum[i] = _maxValue;
        }

        let j: number;
        for (j = 0; j < 10; j++) {
            read(sensor_values, readMode);
            for (i = 0; i < _numSensors; i++) {
                // set the max we found THIS time
                if (j == 0 || max_sensor_values[i] < sensor_values[i]) {
                    max_sensor_values[i] = sensor_values[i];
                }

                // set the min we found THIS time
                if (j == 0 || min_sensor_values[i] > sensor_values[i]) {
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




}
