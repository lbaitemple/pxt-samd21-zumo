// Add your code here
enum ZumoIMUType {
    Unknown,
    LSM303DLHC,
    LSM303D_L3GD20H,
    LSM6DS33_LIS3MDL
}

enum ZumoIMUDirection {
    X,
    Y,
    Z
}

enum ZumoIMUMode {
    ACC,
    MAG,
    GYRO
}

namespace zumo {


    /*! \anchor device_addresses
     *
     * \name Device Addresses
     * @{
     */
    const LSM303DLHC_ACC_ADDR =  0b0011001
    const LSM303DLHC_MAG_ADDR =  0b0011110
    const LSM303D_ADDR =  0b0011101
    const L3GD20H_ADDR =  0b1101011
    const LSM6DS33_ADDR = 0b1101011
    const LIS3MDL_ADDR =  0b0011110
    /*! @} */

    /*! \anchor register_addresses
     *
     * \name Register Addresses
     * @{
     */
    const LSM303D_WHO_ID = 0x49
    const L3GD20H_WHO_ID = 0xD7
    const LSM6DS33_WHO_ID = 0x69
    const LIS3MDL_WHO_ID = 0x3D

    const LSM303DLHC_REG_CTRL_REG1_A = 0x20
    const LSM303DLHC_REG_CTRL_REG4_A = 0x23
    const LSM303DLHC_REG_STATUS_REG_A = 0x27
    const LSM303DLHC_REG_OUT_X_L_A = 0x28

    const LSM303DLHC_REG_CRA_REG_M = 0x00
    const LSM303DLHC_REG_CRB_REG_M = 0x01
    const LSM303DLHC_REG_MR_REG_M = 0x02
    const LSM303DLHC_REG_OUT_X_H_M = 0x03
    const LSM303DLHC_REG_SR_REG_M = 0x09

    const LSM303D_REG_STATUS_M = 0x07
    const LSM303D_REG_OUT_X_L_M = 0x08
    const LSM303D_REG_WHO_AM_I = 0x0F
    const LSM303D_REG_CTRL1 = 0x20
    const LSM303D_REG_CTRL2 = 0x21
    const LSM303D_REG_CTRL5 = 0x24
    const LSM303D_REG_CTRL6 = 0x25
    const LSM303D_REG_CTRL7 = 0x26
    const LSM303D_REG_STATUS_A = 0x27
    const LSM303D_REG_OUT_X_L_A = 0x28

    const L3GD20H_REG_WHO_AM_I = 0x0F
    const L3GD20H_REG_CTRL1 = 0x20
    const L3GD20H_REG_CTRL4 = 0x23
    const L3GD20H_REG_STATUS = 0x27
    const L3GD20H_REG_OUT_X_L = 0x28

    const LSM6DS33_REG_WHO_AM_I = 0x0F
    const LSM6DS33_REG_CTRL1_XL = 0x10
    const LSM6DS33_REG_CTRL2_G = 0x11
    const LSM6DS33_REG_CTRL3_C = 0x12
    const LSM6DS33_REG_STATUS_REG = 0x1E
    const LSM6DS33_REG_OUTX_L_G = 0x22
    const LSM6DS33_REG_OUTX_L_XL = 0x28

    const LIS3MDL_REG_WHO_AM_I = 0x0F
    const LIS3MDL_REG_CTRL_REG1 = 0x20
    const LIS3MDL_REG_CTRL_REG2 = 0x21
    const LIS3MDL_REG_CTRL_REG3 = 0x22
    const LIS3MDL_REG_CTRL_REG4 = 0x23
    const LIS3MDL_REG_STATUS_REG = 0x27
    const LIS3MDL_REG_OUT_X_L = 0x28

    const TEST_REG_ERROR = -1
    const MAXREAD=32767
    const MINREAD = -32767

    // Conversion constants
    const _LSM303ACCEL_MG_LSB = 16704.0
    const _GRAVITY_STANDARD = 9.80665      // Earth's gravity in m/s^2
    const _GAUSS_TO_MICROTESLA = 100.0        // Gauss to micro - Tesla multiplier
    const _lsm303mag_gauss_lsb_xy = 1100.0
    const _lsm303mag_gauss_lsb_z = 980.0

    const DEVIATION_THRESHOLD=0.5
    const CALIBRATION_SAMPLES = 70;

    let _i2c: I2C;
    let lastError = 0;
    let minread = MINREAD;
    let maxread = MAXREAD;
    let type = 0;
    let aa: number[] = [0, 0, 0];
    let a: number[] = [0, 0, 0];
    let g: number[] = [0, 0, 0];
    let m: number[] = [0, 0, 0];
    //let running_min: number[] = [32767, 32767, 32767];
    //let running_max: number[] = [-32767, -32767, -32767];
    let msga='', msgg ='', msgm='';
    let running_min = { x: 32767, y: 32767, z: 32767}; // Initialize running_min
    let running_max = { x: -32767, y: -32767, z: -32767 }; // Initialize running_max


    function init(): number {
        if (testReg(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_CTRL_REG1_A) != TEST_REG_ERROR) {
            // The DLHC doesn't have a documented WHO_AM_I register, so we test for it
            // by looking for a response at the DLHC accelerometer address. (The DLHC
            // magnetometer address is the same as that of the LIS3MDL.)
            type = ZumoIMUType.LSM303DLHC;
            return 1;
        } else if (testReg(LSM303D_ADDR, LSM303D_REG_WHO_AM_I) == LSM303D_WHO_ID &&
            testReg(L3GD20H_ADDR, L3GD20H_REG_WHO_AM_I) == L3GD20H_WHO_ID) {
            type = ZumoIMUType.LSM303D_L3GD20H;
            return 2;
        } else if (testReg(LSM6DS33_ADDR, LSM6DS33_REG_WHO_AM_I) == LSM6DS33_WHO_ID &&
            testReg(LIS3MDL_ADDR, LIS3MDL_REG_WHO_AM_I) == LIS3MDL_WHO_ID) {
            type = ZumoIMUType.LSM6DS33_LIS3MDL;
            return 3;
        } else {
            return 4;
        }
    }

    function enableDefault(): number {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                // Accelerometer
                writeReg(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_CTRL_REG1_A, 0x47);
                if (lastError) { return -1; }
                writeReg(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_CTRL_REG4_A, 0x08);
                if (lastError) { return -1; }

                // Magnetometer
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_CRA_REG_M, 0x0C);
                if (lastError) { return -1; }
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_CRB_REG_M, 0x80);
                if (lastError) { return -1; }
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_MR_REG_M, 0x00);
                return 2;

            case ZumoIMUType.LSM303D_L3GD20H:
                // Accelerometer
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL1, 0x57);
                if (lastError) { return -1; }
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL2, 0x00);
                if (lastError) { return -1; }

                // Magnetometer
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL5, 0x64);
                if (lastError) { return -1; }
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL6, 0x20);
                if (lastError) { return -1; }
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL7, 0x00);
                if (lastError) { return -1; }

                // Gyro
                writeReg(L3GD20H_ADDR, L3GD20H_REG_CTRL1, 0x7F);
                if (lastError) { return -1; }
                writeReg(L3GD20H_ADDR, L3GD20H_REG_CTRL4, 0x00);
                return 3;

            case ZumoIMUType.LSM6DS33_LIS3MDL:
                // Accelerometer
                writeReg(LSM6DS33_ADDR, LSM6DS33_REG_CTRL1_XL, 0x30);
                if (lastError) { return -1; }

                // Gyro
                writeReg(LSM6DS33_ADDR, LSM6DS33_REG_CTRL2_G, 0x50);
                if (lastError) { return -1; }

                // Accelerometer + Gyro
                writeReg(LSM6DS33_ADDR, LSM6DS33_REG_CTRL3_C, 0x04);
                if (lastError) { return -1; }

                // Magnetometer
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG1, 0x70);
                if (lastError) { return -1; }
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG2, 0x00);
                if (lastError) { return -1; }
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG3, 0x00);
                if (lastError) { return -1; }
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG4, 0x0C);
                return 4;
        }
        return 0;
    }

    function configureForCompassHeading(): number {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                // Magnetometer
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_CRA_REG_M, 0x18);
                return 1;

            case ZumoIMUType.LSM303D_L3GD20H:
                // Magnetometer
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL5, 0x70);
                return 2;

            case ZumoIMUType.LSM6DS33_LIS3MDL:
                // Magnetometer
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG1, 0x7C);
                return 3;
        }
        return 0;
    }


    //% blockId=resetAngle
    //% block="Reset Motor Angle"
    //% subcategory=Motors
    export function setup(): void{

        let index = 0;
        
        enableDefault();
        configureForCompassHeading();
        TurnDirection(ZumoMotor.left, 80);
        for (index = 0; index < CALIBRATION_SAMPLES; index++) {
            // Take a reading of the magnetic vector and store it in compass.m
            readMag();
            
            running_min.x = Math.min(running_min.x, m[0]);
            running_min.y = Math.min(running_min.y, m[1]);

            running_max.x = Math.max(running_max.x, m[0]);
            running_max.y = Math.max(running_max.y, m[1]);

            control.waitMicros(50000);
        }

        stopMotor(ZumoMotor.All);
        writeNum(running_max.x);
        writeNum(running_min.x);
        writeString("Done calibration");
    }


    function heading(v: number[]): number {
        let x_scaled: number = 2.0 * (v[0] - running_min.x) / (running_max.x - running_min.x) - 1.0;
        let y_scaled: number = 2.0 * (v[1] - running_min.y) / (running_max.y - running_min.y) - 1.0;

        let angle: number = Math.atan2(y_scaled, x_scaled) * 180 / Math.PI;
        if (angle < 0)
            angle += 360;
        return angle;

    }

    function averageHeading(): number {
        let avg = { x: 0, y: 0, z: 0 };

        for (let i = 0; i < 10; i++) {
            readMag();
            avg.x += m[0];
            avg.y += m[1];
        }

        avg.x /= 10.0;
        avg.y /= 10.0;
        avg.z = 0;

        // avg is the average measure of the magnetic vector.
        return heading([avg.x, avg.y]);
    }

    function relativeHeading(heading_from: number, heading_to: number): number {
        let relative_heading: number = heading_to - heading_from;

        // constrain to -180 to 180 degree range
        if (relative_heading > 180)
            relative_heading -= 360;
        if (relative_heading < -180)
            relative_heading += 360;

        return relative_heading;
    }

    //% blockId=target_heading
    //% block="target_heading $motor at angle $angle "
    //% angle.defl=90
    //% subcategory=Motors
    export function target_heading(motor: ZumoMotor, angle: number): void {

        let target_heading = averageHeading() + angle;
        let stop = 0, SPEED = 200, DEVIATION_THRESHOLD = 0.5;


        while (!stop) {
            let heading = averageHeading();
            let avgHeading = heading + angle;
            let relative_heading = relativeHeading(heading, target_heading);
            let speed: number = SPEED*relative_heading / 180;
            clear();
            writeString("speed:");
            writeNumNewLine(speed);


            if (Math.abs(relative_heading) < DEVIATION_THRESHOLD){
                //stop the motor
                stopMotor(ZumoMotor.All);
                stop = 1;
            }
            else{
                TurnDirection(ZumoMotor.left, speed);
                control.waitMicros(50000);
            }

        }
        stopMotor(ZumoMotor.All);
    }


    function testReg(addr: number, reg: number): number {
        let result = TEST_REG_ERROR;
        let buffer = pins.createBuffer(1);
        buffer.setNumber(NumberFormat.UInt8BE, 0, reg);

        if (pins.i2cWriteBuffer(addr, buffer) != 0) {
            return result;
        }

        let data = pins.i2cReadBuffer(addr, 1);
        if (data.length != 1) {
            return result;
        }
        result = data.getNumber(NumberFormat.Int8LE, 0);
        return result;
    }

    function writeReg(addr: number, reg: number, value: number): void {
        let buffer = pins.createBuffer(2);
        buffer[0] = reg;
        buffer[1] = value;

        lastError = pins.i2cWriteBuffer(addr, buffer);
    }

    function readReg(addr: number, reg: number): number {
        let result = 0;

        // Write the register address
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE, true);

        // Read 1 byte of data
        result = pins.i2cReadNumber(addr, NumberFormat.UInt8BE, false);

        return result;
    }



    function swapBytes(value: number): number {
        let buffer = pins.createBuffer(2);
        buffer.setNumber(NumberFormat.UInt16LE, 0, value);
        let swappedValue = buffer.getNumber(NumberFormat.UInt16BE, 0);
        return swappedValue;
    }

    function readAcc(): void {

        //control.waitMicros(500000);
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                // set MSB of register address for auto-increment
                readAxes16Bit(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_OUT_X_L_A | (1 << 7), aa);
            case ZumoIMUType.LSM303D_L3GD20H:
                // set MSB of register address for auto-increment
                readAxes16Bit(LSM303D_ADDR, LSM303D_REG_OUT_X_L_A | (1 << 7), aa);

            case ZumoIMUType.LSM6DS33_LIS3MDL:
                // assumes register address auto-increment is enabled (IF_INC in CTRL3_C)
                readAxes16Bit(LSM6DS33_ADDR, LSM6DS33_REG_OUTX_L_XL, aa);
        }
        a[0] = convertToTwosComplement(aa[0]) / _LSM303ACCEL_MG_LSB * _GRAVITY_STANDARD;
        a[1] = convertToTwosComplement(aa[1]) / _LSM303ACCEL_MG_LSB * _GRAVITY_STANDARD;
        a[2] = convertToTwosComplement(aa[2]) / _LSM303ACCEL_MG_LSB * _GRAVITY_STANDARD;
        a[0] = Math.round(a[0] * 100) / 100;
        a[1] = Math.round(a[1] * 100) / 100;
        a[2] = Math.round(a[2] * 100) / 100;

    }

    function convertToTwosComplement(num: number): number {
        const numBits = 16; // Assuming the number is represented using 16 bits
        const maxPositiveValue = Math.pow(2, numBits - 1) - 1;
        if (num >= 0 && num <= maxPositiveValue) {
            return num; // Number is already positive or zero
        } else {
            return (num - Math.pow(2, numBits)) % Math.pow(2, numBits);
        }
    }

    function readAxes16Bit(addr: number, firstReg: number, v: number[]): void {
        let buffer = pins.createBuffer(6);

        // Write the first register address
        pins.i2cWriteNumber(addr, firstReg, NumberFormat.UInt8BE, false);

        // Read 6 bytes of data
        buffer = pins.i2cReadBuffer(addr, 6);

        let xl = buffer[0];
        let xh = buffer[1];
        let yl = buffer[2];
        let yh = buffer[3];
        let zl = buffer[4];
        let zh = buffer[5];

        // Combine high and low bytes
        v[0] = (xh << 8) | xl;
        v[1] = (yh << 8) | yl;
        v[2] = (zh << 8) | zl;
    }


    function readGyro(): void {
        let gg = [0, 0, 0];
        if (type == ZumoIMUType.LSM303D_L3GD20H) {
            // Set MSB of register address for auto-increment
            readAxes16Bit(L3GD20H_ADDR, L3GD20H_REG_OUT_X_L | (1 << 7), gg);

        } else if (type == ZumoIMUType.LSM6DS33_LIS3MDL) {
            // Assumes register address auto-increment is enabled (IF_INC in CTRL3_C)
            readAxes16Bit(LSM6DS33_ADDR, LSM6DS33_REG_OUTX_L_G, gg);
        }
        g[0] = convertToTwosComplement(gg[0]);
        g[1] = convertToTwosComplement(gg[1]);
        g[2] = convertToTwosComplement(gg[2]);

    }

    function lsmread(): void {
        while (!accDataReady()){
            control.waitMicros(40);
        }
        readAcc();
        if (lastError) { return; }
        while (!gyroDataReady()) {
            control.waitMicros(40);
        }
        readGyro();
        if (lastError) { return; }
        while (!magDataReady()) {
            control.waitMicros(40);
        }
        readMag();
    }

    function lsmreadacc(): void {
        if (lastError) { return; }
        while (!accDataReady()) {
            control.waitMicros(4000);
        }
        readAcc();
    }

    function lsmreadgyro(): void {

        if (lastError) { return; }
        while (!gyroDataReady()) {
            control.waitMicros(4000);
        }
        readGyro();

    }

    function lsmreadmag(): void {
        if (lastError) { return; }
        while (!magDataReady()) {
            control.waitMicros(4000);
        }
        readMag();
    }

    function readMag(): void {
        let mm = [0, 0, 0];
        if (type == ZumoIMUType.LSM303DLHC) {
            // Magnetometer automatically increments register address
            readAxes16Bit(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_OUT_X_H_M, mm);
            // readAxes16Bit assumes the sensor axis outputs are little-endian and in XYZ order.
            // However, the DLHC magnetometer outputs are big-endian and in XZY order,
            // so we need to shuffle the values around.
            m = [swapBytes(m[0]), swapBytes(m[2]), swapBytes(m[1])];
        } else if (type == ZumoIMUType.LSM303D_L3GD20H) {
            // Set MSB of register address for auto-increment
            readAxes16Bit(LSM303D_ADDR, LSM303D_REG_OUT_X_L_M | (1 << 7), mm);
        } else if (type == ZumoIMUType.LSM6DS33_LIS3MDL) {
            // Set MSB of register address for auto-increment
            readAxes16Bit(LIS3MDL_ADDR, LIS3MDL_REG_OUT_X_L | (1 << 7), mm);
        }

        m[0] = convertToTwosComplement(mm[0])/ _lsm303mag_gauss_lsb_xy * _GAUSS_TO_MICROTESLA;
        m[1] = convertToTwosComplement(mm[1]) / _lsm303mag_gauss_lsb_xy * _GAUSS_TO_MICROTESLA;
        m[2] = convertToTwosComplement(mm[2]) / _lsm303mag_gauss_lsb_xy * _GAUSS_TO_MICROTESLA;
    }


    function accDataReady(): boolean {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                return (readReg(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_STATUS_REG_A) & 0x08) !== 0;
            case ZumoIMUType.LSM303D_L3GD20H:
                return (readReg(LSM303D_ADDR, LSM303D_REG_STATUS_A) & 0x08) !== 0;
            case ZumoIMUType.LSM6DS33_LIS3MDL:
                return (readReg(LSM6DS33_ADDR, LSM6DS33_REG_STATUS_REG) & 0x01) !== 0;
            default:
                return false;
        }
    }

    function gyroDataReady(): boolean {
        switch (type) {
            case ZumoIMUType.LSM303D_L3GD20H:
                return (readReg(L3GD20H_ADDR, L3GD20H_REG_STATUS) & 0x08) !== 0;
            case ZumoIMUType.LSM6DS33_LIS3MDL:
                return (readReg(LSM6DS33_ADDR, LSM6DS33_REG_STATUS_REG) & 0x02) !== 0;
            default:
                return false;
        }
    }

    //% blockId=getMsg
    //% block="get msg from acc"
    //% subcategory=IMU
    export function getMsg(): string{
        let msg = msga;
        return msg;
    }

 
    function magDataReady(): boolean {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                return (readReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_SR_REG_M) & 0x01) !== 0;
            case ZumoIMUType.LSM303D_L3GD20H:
                return (readReg(LSM303D_ADDR, LSM303D_REG_STATUS_M) & 0x08) !== 0;
            case ZumoIMUType.LSM6DS33_LIS3MDL:
                return (readReg(LIS3MDL_ADDR, LIS3MDL_REG_STATUS_REG) & 0x08) !== 0;
            default:
                return false;
        }
    }

    /**
     * 
     */
    //% block="enable IMU "
    //% subcategory=IMU
    export function enableIMU(): void {
        let ret = 0, ret1= 0, ret2=0;
        
        while (ret==0) {
            ret = init();
            control.waitMicros(400);
        }

        ret1=enableDefault();
        ret2=configureForCompassHeading();
        let restr =`init ${ret},  ${ret1}  ${ret2}`;
        return;
    }

    //% blockId=readIMUy
    //% block="read readIMU $mode for $dir"
    //% mode.defl = ZumoIMUMode.ACC
    //% dir.defl = ZumoIMUDirection.X
    //% subcategory=IMU
    export function readIMU(mode: ZumoIMUMode, dir:ZumoIMUDirection): number {
        control.waitMicros(500);
        //lsmread();
        switch (mode){
            case ZumoIMUMode.ACC:
                lsmreadacc();
                return a[dir];
            case ZumoIMUMode.MAG:
                lsmreadmag();
                return m[dir];
            case ZumoIMUMode.GYRO:
                lsmreadgyro();
                return g[dir];
        }
        
    }


}
