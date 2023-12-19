/**
* Custom blocks
*/
//% color="#4C97FF" icon="\uf494"
//% groups="['Motor', 'IMU', 'LED']"
// board match the pin out is sparkfun ATsamd21g board
// ref: https://www.pololu.com/docs/0J63/all#3.13
//  D10 -	Left motor PWM - need to change it 
//  MOSI (D8) -	Left motor direction
//  D9  -   Right motor PWM
//  D7 - Right motor direction or (https://roboticsbackend.com/arduino-uno-pins-a-complete-practical-guide/)
//  D13 is for onboard LED
//  MISO (D12) - ZUMO_BUTTON pushbutton
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
    const motorRotations = [
        ZumoMotorRotation.Forward,
        ZumoMotorRotation.Backward,
    ];

    /**
    * Orient in the direction of the value specified and move forward..
    * @param is the preferred_heading angle to orient to.
    * This function returns an array of 2 numbers which are speeds for left and right motor
    */
    //% blockId="zumo_motor_run" block="run motor %motor | at speed %speed \\%"
    //% speed.min=-100
    //% speed.max=100
    //% weight=90
    //% subcategory=Motors
    export function runMotor(motor: ZumoMotor, speed: number): void {

        if (speed === 0) {
            stopMotor(motor);
            return;
        }
        const absSpeedPercentage = Math.min(Math.abs(speed), 100);
        const analogSpeed = mapValue(absSpeedPercentage, 0, 100, 0, 255);

        if (motor === ZumoMotor.left) {
            const isClockwise = speed * motorRotations[ZumoMotor.left] > 0;
            pins.D7.digitalWrite(isClockwise ? true : false);
            //   pins.D8.digitalWrite(isClockwise ? true : false);

            if (speed === 100) {
                // Avoid PWM whenever possible as only 3 concurrent PWM outputs are available on the microbit
                //pins.digitalWritePin(DigitalPin.P13, 1);
                pins.D10.digitalWrite(true);
            } else {
                pins.D10.analogSetPeriod(255);
                pins.D10.analogWrite(analogSpeed);
            }
        }
        else if (motor === ZumoMotor.right ) {
            const isClockwise = speed * motorRotations[ZumoMotor.right] > 0;
            //        pins.D7.digitalWrite(isClockwise ? true : false);
            pins.D8.digitalWrite(isClockwise ? true : false);
            if (speed === 100) {
                // Avoid PWM whenever possible as only 3 concurrent PWM outputs are available on the microbit
                //pins.digitalWritePin(DigitalPin.P14, 1);
                pins.D9.digitalWrite(true);
            } else {
                pins.D9.analogSetPeriod(255);
                pins.D9.analogWrite(analogSpeed);
            }
        }
        else if (motor == ZumoMotor.All){
            const isClockwise = speed * motorRotations[ZumoMotor.All] > 0;
            pins.D7.digitalWrite(isClockwise ? true : false);
            pins.D8.digitalWrite(isClockwise ? true : false);

            if (speed === 100) {
                // Avoid PWM whenever possible as only 3 concurrent PWM outputs are available on the microbit
                //pins.digitalWritePin(DigitalPin.P13, 1);
                pins.D10.digitalWrite(true);
                pins.D9.digitalWrite(true);
            } else {
                pins.D10.analogSetPeriod(255);
                pins.D10.analogWrite(analogSpeed);
                pins.D9.analogSetPeriod(255);
                pins.D9.analogWrite(analogSpeed);
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
        if (motor === ZumoMotor.left ) {

            //pins.digitalWritePin(DigitalPin.P11, 0);
            //pins.digitalWritePin(DigitalPin.P12, 0);
            //pins.digitalWritePin(DigitalPin.P13, 0);

            pins.D10.digitalWrite(false);  //left motor  PWM
            pins.D9.digitalWrite(false);  //right motor PWM
            pins.D8.digitalWrite(false); // direction left
        }

        else if (motor === ZumoMotor.right ) {
            //pins.digitalWritePin(pins.D15, 0);
            //pins.digitalWritePin(DigitalPin.P16, 0);
            //pins.digitalWritePin(DigitalPin.P14, 0);
            pins.D10.digitalWrite(false);   //left motor  PWM
            pins.D9.digitalWrite(false);   //right motor PWM
            pins.D7.digitalWrite(false);  //direction right
        }
        else if (motor == ZumoMotor.All){
            pins.D10.digitalWrite(false);  //left motor  PWM
            pins.D9.digitalWrite(false);  //right motor PWM
            pins.D8.digitalWrite(false); // direction left
            pins.D7.digitalWrite(false);  //direction right

        }
    }

    //% blockId="turn" block="Turn Direction %motor at speed %speed \\%"
    //% speed.min=-100
    //% speed.max=100
    //% weight=90
    //% subcategory=Motors
    export function TurnDirection(motor: ZumoMotor, speed: number){
        if (motor === ZumoMotor.left){
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
        if (motor === ZumoMotor.left || motor === ZumoMotor.All) {
            motorRotations[ZumoMotor.left] = rotation;
        }

        else if (motor === ZumoMotor.right || motor === ZumoMotor.All) {
            motorRotations[ZumoMotor.right] = rotation;
        }
    }

    //% subcategory=Motors
    //% block="rotate motor $dir at $speed %"
    //% weight=88
    function rotateMotor(speed: number, dir: ZumoMotorRotation): void {
        if (dir === ZumoMotorRotation.Forward){
            runMotor(ZumoMotor.left, speed)
            runMotor(ZumoMotor.right, speed)
        }else{
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
