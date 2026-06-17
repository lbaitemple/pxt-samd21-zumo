// Add your code here
namespace zumo {


// ---- Border calibration state (module scope) ----
let left_min = 1000;
let left_max = 0;
let right_min = 1000;
let right_max = 0;

let LEFT_BORDER_THRESHOLD = 850;
let RIGHT_BORDER_THRESHOLD = 850;

const LEFT_INDEX = 0;
const RIGHT_INDEX = 4;

//% block="auto calibrate border"
//% subcategory=Light
//% group="calibration"
export function autoCalibrateBorder(): void {
    // reset so repeated calls don't accumulate stale extremes
    left_min = 1000;
    left_max = 0;
    right_min = 1000;
    right_max = 0;

    clear();
    writeStringNewLine("AUTO CALIBRATING");
    writeStringNewLine("SPINNING...");

    let start = control.millis();

    // Spin one direction for the first 5 s
    while (control.millis() - start < 5000) {
        runMotor(ZumoMotor.left, 200);
        runMotor(ZumoMotor.right, -200);
        let sensors = readLine();
        let left = sensors[LEFT_INDEX];
        let right = sensors[RIGHT_INDEX];

        left_min = Math.min(left_min, left);
        left_max = Math.max(left_max, left);
        right_min = Math.min(right_min, right);
        right_max = Math.max(right_max, right);

        pause(10);
    }

    // Spin the other direction for the next 5 s
    while (control.millis() - start < 10000) {
        runMotor(ZumoMotor.left, -200);
        runMotor(ZumoMotor.right, 200);
        let sensors = readLine();
        let left = sensors[LEFT_INDEX];
        let right = sensors[RIGHT_INDEX];

        left_min = Math.min(left_min, left);
        left_max = Math.max(left_max, left);
        right_min = Math.min(right_min, right);
        right_max = Math.max(right_max, right);

        pause(10);
    }

    stopMotor(ZumoMotor.All);

    LEFT_BORDER_THRESHOLD = left_min + Math.idiv(left_max - left_min, 25);
    RIGHT_BORDER_THRESHOLD = right_min + Math.idiv(right_max - right_min, 25);

    clear();
    writeStringNewLine("CAL DONE");
    writeStringNewLine("L:" + LEFT_BORDER_THRESHOLD);
    writeStringNewLine("R:" + RIGHT_BORDER_THRESHOLD);
    pause(800);
}

//% block="left border threshold"
//% subcategory=Light
//% group="calibration"
export function leftBorderThreshold(): number {
    return LEFT_BORDER_THRESHOLD;
}

//% block="right border threshold"
//% subcategory=Light
//% group="calibration"
export function rightBorderThreshold(): number {
    return RIGHT_BORDER_THRESHOLD;
}
}