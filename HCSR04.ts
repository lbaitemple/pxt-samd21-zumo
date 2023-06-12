// Add your code here

namespace zumo {
    let echoPin: DigitalInOutPin = pins.D2;
    let trigPin: DigitalInOutPin= pins.D7;

    function calculateDistance(): number {
        trigPin.digitalWrite(false);
        pause(2);
        trigPin.digitalWrite(true);
        pause(10);
        trigPin.digitalWrite(false);
        
        let d = echoPin.pulseIn(PulseValue.High, 23529.4);

        return d / 58.8235;
    }

    //% block="Ultrasound at trig $trig and echo $echo "
    //% trig.defl=pins.SCL
    //% echo.defl=pins.SDA
    //% subcategory=Ultrasound
    export function HCSR04(trig:DigitalInOutPin, echo:DigitalInOutPin): number{
        echoPin = echo;
        trigPin = trig;
        return calculateDistance();
    }
}