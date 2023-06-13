// Add your code here
namespace zumo {
    let color: number=1, last_color: number=1, last:number=0;
    //% block="QTR at $pin with Emit $epin "
    //% pin.defl=pins.D2
    //% epin.defl=pins.D4
    //% subcategory=QTR
    export function QTR(pin: DigitalInOutPin, epin: DigitalInOutPin): number {
        epin.digitalWrite(true);
        pin.digitalWrite(true)
        control.waitMicros(12);
        pin.digitalWrite(false)
        let time:number = control.micros();
        
        
        while (pin.digitalRead() == true) { }
        
        if ((control.micros() - time) > last && color == 1) {
            color = -1;
        } else if ((control.micros() - time) < last && color == -1) {
            color = 1;
        }
        epin.digitalWrite(false);
        last = control.micros() - time;
        last_color = color;
        return color;
    }

}
