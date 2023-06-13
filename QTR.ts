// Add your code here
namespace zumo {
    let color: number, last_color: number, last:number;
    //% block="QTR at $pin with Emit $epin "
    //% pin.defl=pins.D2
    //% epin.defl=pins.D4
    //% subcategory=QTR
    export function QTR(pin: DigitalInOutPin, epin: DigitalInOutPin): number {
        pin.digitalWrite(true)
        control.waitMicros(12);
        pin.digitalWrite(false)
        let time = control.micros();

        while (pin.digitalRead() == true) { }

        if ((control.micros() - time) > last && color == 1) {
            color = -1;
        } else if ((control.micros() - time) < last && color == -1) {
            color = 1;
        }

        last = control.micros() - time;
        last_color = color;
        return color;
    }

}
