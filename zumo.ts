/**
* Custom blocks
*/
//% color="#4C97FF" icon="\uf494"
//% groups="['Motor', 'IMU', 'LED']"
// board match the pin out is sparkfun ATsamd21g board
// ref: https://www.pololu.com/docs/0J63/all#3.13
// D10 - Left motor PWM
// MOSI (D8) - Left motor direction
// D9 - Right motor PWM
// D7 - Right motor direction
// D13 is for onboard LED
// MISO (D12) - ZUMO_BUTTON pushbutton
//
const enum ZumoMotor {
    //% block="left"
    left = 0,
    //% block="right"
    right = 1,
    //% block="left + right"
    All = 2,
}

declare interface Math {
    floor(x: number): number;
}

const enum ZumoLED {
    //% block="ON"
    ON = 1,
    //% block="OFF"
    OFF = 0,
}

const enum ZumoNotes {
    //% block="ON"
    ON = 1,
    //% block="OFF"
    OFF = 0,
}

const enum ZumoMotors {
    //% block="ON"
    LEFT_ON = 1,
    //% block="OFF"
    LEFT_OFF = 0,
    //% block="ON"
    RIGHT_ON = 1,
    //% block="OFF"
    RIGHT_OFF = 0,
}

const enum DistanceUnit {
    //% block="cm"
    CM = 58, // Duration of echo round-trip in Microseconds (uS) for two centimeters, 343 m/s at sea level and 20°C
    //% block="inch"
    INCH = 148, // Duration of echo round-trip in Microseconds (uS) for two inches, 343 m/s at sea level and 20°C
}

const enum ZumoMotorRotation {
    //% block="forward"
    Forward = 1,
    //% block="backward"
    Backward = -1,
}

const enum ZumoPushButtonState {
    //% block="forward"
    Forward = 1,
    //% block="backward"
    Backward = -1,
}

function mapValue(
    value: number,
    inputMin: number,
    inputMax: number,
    outputMin: number,
    outputMax: number
): number {
    return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
}

namespace zumo {
    // Per-motor rotation setting, indexed by ZumoMotor (0 = left, 1 = right).
    // Default both to Forward (no flip), matching the Pololu library where
    // flipLeft/flipRight both default to false. Backward acts as a software
    // flip so you can fix a backwards-wired motor without rewiring.
    const motorRotations = [
        ZumoMotorRotation.Forward, // left
        ZumoMotorRotation.Forward, // right
    ];

    // PWM period in MICROSECONDS. 50 us = 20 kHz, matching the Pololu C++
    // library's 20 kHz timer config: above the audible range, smoother low-end
    // torque. (The original 255 was ~3.9 kHz and audible.)
    const MOTOR_PWM_PERIOD_US = 50;

    let leftMotorstate = ZumoMotors.LEFT_OFF;
    let rightMotorstate = ZumoMotors.RIGHT_OFF;

    /**
     * Direction pin level for a motor, replicating the Pololu logic:
     *   digitalWrite(DIR, HIGH) when (reverse XOR flip)
     * where reverse = speed is negative, flip = rotation set to Backward.
     */
    function motorDirHigh(motor: ZumoMotor, speed: number): boolean {
        const reverse = speed < 0;
        const flip = motorRotations[motor] === ZumoMotorRotation.Backward;
        return reverse !== flip; // boolean XOR
    }

    /**
     * Orient in the direction of the value specified and move forward..
     * @param is the preferred_heading angle to orient to.
     * This function returns an array of 2 numbers which are speeds for left and right motor
     */
    //% blockId="zumo_motor_run" block="run motor %motor | at speed %speed \\%"
    //% speed.min=-100
    //% speed.defl = 20
    //% speed.max=100
    //% weight=90
    //% subcategory=Motors
    export function runMotor(motor: ZumoMotor, speed: number): void {
        if (speed == 0) {
            stopMotor(motor);
            return;
        }
        const absSpeedPercentage = Math.min(Math.abs(speed), 100);
        const analogSpeed = mapValue(absSpeedPercentage, 0, 100, 0, 255);

        if (motor == ZumoMotor.right) {
            pins.D7.digitalWrite(motorDirHigh(ZumoMotor.right, speed));
            if (speed === 100 || speed === -100) {
                // Full speed: drive the PWM pin fully high.
                pins.D9.digitalWrite(true);
                rightMotorstate = ZumoMotors.RIGHT_ON;
            } else {
                // Always (re)write the PWM duty so a NEW speed takes effect.
                pins.D9.analogSetPeriod(MOTOR_PWM_PERIOD_US);
                pins.D9.analogWrite(analogSpeed);
                rightMotorstate = ZumoMotors.RIGHT_ON;
            }
        }
        else if (motor == ZumoMotor.left) {
            pins.D8.digitalWrite(motorDirHigh(ZumoMotor.left, speed));
            if (speed === 100 || speed === -100) {
                pins.D10.digitalWrite(true);
                leftMotorstate = ZumoMotors.LEFT_ON;
            } else {
                pins.D10.analogSetPeriod(MOTOR_PWM_PERIOD_US);
                pins.D10.analogWrite(analogSpeed);
                leftMotorstate = ZumoMotors.LEFT_ON;
            }
        }
        else if (motor == ZumoMotor.All) {
            pins.D7.digitalWrite(motorDirHigh(ZumoMotor.right, speed));
            pins.D8.digitalWrite(motorDirHigh(ZumoMotor.left, speed));
            if (speed === 100 || speed === -100) {
                pins.D10.digitalWrite(true);
                leftMotorstate = ZumoMotors.LEFT_ON;
                pins.D9.digitalWrite(true);
                rightMotorstate = ZumoMotors.RIGHT_ON;
            } else {
                pins.D10.analogSetPeriod(MOTOR_PWM_PERIOD_US);
                pins.D10.analogWrite(analogSpeed);
                leftMotorstate = ZumoMotors.LEFT_ON;

                pins.D9.analogSetPeriod(MOTOR_PWM_PERIOD_US);
                pins.D9.analogWrite(analogSpeed);
                rightMotorstate = ZumoMotors.RIGHT_ON;
            }
        }
    }

    /**
     * Stops a motor.
     * @param motor motor, eg: ZumoMotor.left
     */
    //% subcategory=Motors
    //% blockId="zumo_motor_stop" block="stop motor %motor"
    //% weight=89
    export function stopMotor(motor: ZumoMotor): void {
        if (motor == ZumoMotor.left) {
            pins.D10.analogWrite(0);
            pins.D10.digitalWrite(false); //left motor PWM
            pins.D8.digitalWrite(false); // direction left
            leftMotorstate = ZumoMotors.LEFT_OFF;
        }
        else if (motor == ZumoMotor.right) {
            pins.D9.analogWrite(0);
            pins.D9.digitalWrite(false); //right motor PWM
            pins.D7.digitalWrite(false); //direction right
            rightMotorstate = ZumoMotors.RIGHT_OFF;
        }
        else if (motor == ZumoMotor.All) {
            pins.D10.analogWrite(0);
            pins.D9.analogWrite(0);
            pins.D10.digitalWrite(false); //left motor PWM
            pins.D9.digitalWrite(false); //right motor PWM
            pins.D8.digitalWrite(false); // direction left
            pins.D7.digitalWrite(false); //direction right
            leftMotorstate = ZumoMotors.LEFT_OFF;
            rightMotorstate = ZumoMotors.RIGHT_OFF;
        }
        control.waitMicros(5000); // wait until the state is updated.
    }

    //% blockId="turn" block="Turn Direction %motor at speed %speed \\%"
    //% speed.min=-100
    //% speed.max=100
    //% weight=90
    //% subcategory=Motors
    export function TurnDirection(motor: ZumoMotor, speed: number) {
        if (motor === ZumoMotor.left) {
            runMotor(ZumoMotor.left, -speed)
            runMotor(ZumoMotor.right, speed)
        }
        else if (motor === ZumoMotor.right) {
            runMotor(ZumoMotor.left, speed)
            runMotor(ZumoMotor.right, -speed)
        }
    }

    /**
     * Sets the rotation direction of a motor. Use this function at start time to configure your motors without the need to rewire.
     * @param motor motor, eg: ZumoMotor.left
     * @param rotation rotation of the motor, eg: ZumoMotorRotation.Forward
     */
    //% subcategory=Motors
    //% blockId=zumo_motor_set_rotation block="set motor %motor rotation | to %rotation"
    //% weight=88
    export function setMotorRotation(
        motor: ZumoMotor,
        rotation: ZumoMotorRotation
    ) {
        // Independent ifs so that "All" sets BOTH motors (the old else-if
        // chain silently skipped the right motor for the All case).
        if (motor === ZumoMotor.left || motor === ZumoMotor.All) {
            motorRotations[ZumoMotor.left] = rotation;
        }
        if (motor === ZumoMotor.right || motor === ZumoMotor.All) {
            motorRotations[ZumoMotor.right] = rotation;
        }
    }

    //% subcategory=Motors
    //% block="rotate motor $dir at $speed %"
    //% weight=88
    function rotateMotor(speed: number, dir: ZumoMotorRotation): void {
        if (dir === ZumoMotorRotation.Forward) {
            runMotor(ZumoMotor.left, speed)
            runMotor(ZumoMotor.right, speed)
        } else {
            runMotor(ZumoMotor.left, -speed)
            runMotor(ZumoMotor.right, -speed)
        }
        return
    }

    //% blockId="zumo_led" block="Turn LED %state"
    //% weight=90
    //% subcategory=LED
    export function setZumoLED(
        state: ZumoLED
    ) {
        pins.D13.digitalWrite(state ? true : false);
    }

    //% blockId="zumo_button" block="get button %ZumoPushButtonState"
    //% weight=90
    //% subcategory=Button
    export function getZumoButtonState(): boolean {
        return input.buttonD12.isPressed();
    }

    //% blockId=Tinybit_Ultrasonic_Car block="ultrasonic at %pulsePin %readPin return distance(cm)"
    //% color="#006400"
    //% weight=87
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% subcategory=Ultrasonic
    /*export function Ultrasonic(
        pulsePin: DigitalInOutPin,
        readPin: DigitalInOutPin
    ): number {
        let list: Array<number> = [0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) {
            pulsePin.setPull(PinPullMode.PullNone);
            pulsePin.digitalWrite(false);
            control.waitMicros(2);
            pulsePin.digitalWrite(true);
            control.waitMicros(15);
            pulsePin.digitalWrite(false);
            let d = readPin.pulseIn(PulseValue.High, 43200);
            list[i] = Math.floor(d / 40);
        }
        list.sort();
        let length = (list[1] + list[2] + list[3]) / 3;
        return Math.floor(length);
    }
    */
}
