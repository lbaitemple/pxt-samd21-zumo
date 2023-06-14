// Add your code here
namespace zumo {
    let pinValues: boolean[] = [];
    let eventTimes: number[] = [];


    //% block="QTR using Emit $epin "
    //% epin.defl=pins.D2
    //% subcategory=QTR
    export function QTR(epin: DigitalInOutPin): number [] {
        epin.digitalWrite(true);
        control.waitMicros(12);
        readPins();
        epin.digitalWrite(false);

        return eventTimes;
    }



    function readPins(): void {
        const pinsToRead: DigitalInOutPin[] = [pins.D4, pins.A3, pins.D11, pins.A0, pins.A2, pins.D5];

        control.runInParallel(() => {
            for (let i = 0; i < pinsToRead.length; i++) {
                const pin = pinsToRead[i];
                pin.digitalWrite(true)
                control.waitMicros(10)
                pin.digitalWrite(false)
                const startTime = control.millis();
                let value = pin.digitalRead();
                while (value==true){}
                const eventTime = control.millis() - startTime;
                storePinValueAndTime(i, value, eventTime);
            }
        });
    }

    function storePinValueAndTime(index: number, value: boolean, time: number): void {
        // Store the pin value and event time in the respective arrays
        pinValues[index] = value;
        eventTimes[index] = time;
    }

}
