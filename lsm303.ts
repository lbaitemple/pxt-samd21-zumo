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

namespace zumo {


    /*! \anchor device_addresses
     *
     * \name Device Addresses
     * @{
     */
    const LSM303DLHC_ACC_ADDR = 0x19 // 0b0011001
    const LSM303DLHC_MAG_ADDR = 0x1E // 0b0011110
    const LSM303D_ADDR = 0x1D // 0b0011101
    const L3GD20H_ADDR = 0x6B // 0b1101011
    const LSM6DS33_ADDR = 0x6B  // 0b1101011
    const LIS3MDL_ADDR = 0x1E  // 0b0011110
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

    let _i2c: I2C;
    let lastError = 0;
    let type = 0;
    let a: number[] = [0, 0, 0];
    let g: number[] = [0, 0, 0];
    let m: number[] = [0, 0, 0];


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

    function enableDefault(): void {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                // Accelerometer
                writeReg(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_CTRL_REG1_A, 0x47);
                if (lastError) { return; }
                writeReg(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_CTRL_REG4_A, 0x08);
                if (lastError) { return; }

                // Magnetometer
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_CRA_REG_M, 0x0C);
                if (lastError) { return; }
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_CRB_REG_M, 0x80);
                if (lastError) { return; }
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_MR_REG_M, 0x00);
                return;

            case ZumoIMUType.LSM303D_L3GD20H:
                // Accelerometer
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL1, 0x57);
                if (lastError) { return; }
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL2, 0x00);
                if (lastError) { return; }

                // Magnetometer
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL5, 0x64);
                if (lastError) { return; }
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL6, 0x20);
                if (lastError) { return; }
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL7, 0x00);
                if (lastError) { return; }

                // Gyro
                writeReg(L3GD20H_ADDR, L3GD20H_REG_CTRL1, 0x7F);
                if (lastError) { return; }
                writeReg(L3GD20H_ADDR, L3GD20H_REG_CTRL4, 0x00);
                return;

            case ZumoIMUType.LSM6DS33_LIS3MDL:
                // Accelerometer
                writeReg(LSM6DS33_ADDR, LSM6DS33_REG_CTRL1_XL, 0x30);
                if (lastError) { return; }

                // Gyro
                writeReg(LSM6DS33_ADDR, LSM6DS33_REG_CTRL2_G, 0x50);
                if (lastError) { return; }

                // Accelerometer + Gyro
                writeReg(LSM6DS33_ADDR, LSM6DS33_REG_CTRL3_C, 0x04);
                if (lastError) { return; }

                // Magnetometer
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG1, 0x70);
                if (lastError) { return; }
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG2, 0x00);
                if (lastError) { return; }
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG3, 0x00);
                if (lastError) { return; }
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG4, 0x0C);
                return;
        }
    }

    function configureForCompassHeading(): void {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                // Magnetometer
                writeReg(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_CRA_REG_M, 0x18);
                return;

            case ZumoIMUType.LSM303D_L3GD20H:
                // Magnetometer
                writeReg(LSM303D_ADDR, LSM303D_REG_CTRL5, 0x70);
                return;

            case ZumoIMUType.LSM6DS33_LIS3MDL:
                // Magnetometer
                writeReg(LIS3MDL_ADDR, LIS3MDL_REG_CTRL_REG1, 0x7C);
                return;
        }
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
        let value = 0;

        let buffer = pins.createBuffer(1);
        buffer[0] = reg;

        lastError = pins.i2cWriteBuffer(addr, buffer);

        let data = pins.i2cReadBuffer(addr, 1);
        if (data.length != 1) {
            lastError = 50;
            return 0;
        }

        value = data[0];
        return value;
    }


    function swapBytes(value: number): number {
        let buffer = pins.createBuffer(2);
        buffer.setNumber(NumberFormat.UInt16LE, 0, value);
        let swappedValue = buffer.getNumber(NumberFormat.UInt16BE, 0);
        return swappedValue;
    }

    function readAcc(): void {
        switch (type) {
            case ZumoIMUType.LSM303DLHC:
                // set MSB of register address for auto-increment
                readAxes16Bit(LSM303DLHC_ACC_ADDR, LSM303DLHC_REG_OUT_X_L_A | (1 << 7), a);
                return;

            case ZumoIMUType.LSM303D_L3GD20H:
                // set MSB of register address for auto-increment
                readAxes16Bit(LSM303D_ADDR, LSM303D_REG_OUT_X_L_A | (1 << 7), a);
                return;

            case ZumoIMUType.LSM6DS33_LIS3MDL:
                // assumes register address auto-increment is enabled (IF_INC in CTRL3_C)
                readAxes16Bit(LSM6DS33_ADDR, LSM6DS33_REG_OUTX_L_XL, a);
                return;
        }
    }


    function readAxes16Bit(addr: number, firstReg: number, v: number[]): void {
        let xl: number, xh: number, yl: number, yh: number, zl: number, zh: number;

        pins.i2cWriteNumber(addr, firstReg, NumberFormat.UInt8BE);
        let lastError = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        if (lastError) {
            return;
        }

        let byteCount = pins.i2cReadBuffer(addr, 6).length;
        if (byteCount !== 6) {
            lastError = 50;
            return;
        }

        xl = pins.i2cReadNumber(addr, NumberFormat.UInt8LE);
        xh = pins.i2cReadNumber(addr, NumberFormat.UInt8LE);
        yl = pins.i2cReadNumber(addr, NumberFormat.UInt8LE);
        yh = pins.i2cReadNumber(addr, NumberFormat.UInt8LE);
        zl = pins.i2cReadNumber(addr, NumberFormat.UInt8LE);
        zh = pins.i2cReadNumber(addr, NumberFormat.UInt8LE);

        // combine high and low bytes
        v[0] = (xh << 8) | xl;
        v[1] = (yh << 8) | yl;
        v[2] = (zh << 8) | zl;
        v[2] = 45;
    }


    function readGyro(): void {
        if (type == ZumoIMUType.LSM303D_L3GD20H) {
            // Set MSB of register address for auto-increment
            readAxes16Bit(L3GD20H_ADDR, L3GD20H_REG_OUT_X_L | (1 << 7), g);
        } else if (type == ZumoIMUType.LSM6DS33_LIS3MDL) {
            // Assumes register address auto-increment is enabled (IF_INC in CTRL3_C)
            readAxes16Bit(LSM6DS33_ADDR, LSM6DS33_REG_OUTX_L_G, g);
        }
    }

    function read(): void {
        readAcc();
        if (lastError) { return; }
        readGyro();
        if (lastError) { return; }
        readMag();
    }

    function readMag(): void {
        if (type == ZumoIMUType.LSM303DLHC) {
            // Magnetometer automatically increments register address
            readAxes16Bit(LSM303DLHC_MAG_ADDR, LSM303DLHC_REG_OUT_X_H_M, m);
            // readAxes16Bit assumes the sensor axis outputs are little-endian and in XYZ order.
            // However, the DLHC magnetometer outputs are big-endian and in XZY order,
            // so we need to shuffle the values around.
            m = [swapBytes(m[0]), swapBytes(m[2]), swapBytes(m[1])];
        } else if (type == ZumoIMUType.LSM303D_L3GD20H) {
            // Set MSB of register address for auto-increment
            readAxes16Bit(LSM303D_ADDR, LSM303D_REG_OUT_X_L_M | (1 << 7), m);
        } else if (type == ZumoIMUType.LSM6DS33_LIS3MDL) {
            // Set MSB of register address for auto-increment
            readAxes16Bit(LIS3MDL_ADDR, LIS3MDL_REG_OUT_X_L | (1 << 7), m);
        }
    }

    //% blockId=readIMUxp
    //% block="accDataReady"
    //% subcategory=IMU
    export function accDataReady(): boolean {
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
    //% blockId=enableIMU
    //% block="enable IMU "
    //% subcategory=IMU
    export function enableIMU(): number {
        let ret = 0;
        while (ret==0) {
            ret = init();
            control.waitMicros(400);
        }
        return ret;
        enableDefault();
        configureForCompassHeading();

    }

    //% blockId=readIMUx
    //% block="read readIMUAccx "
    //% subcategory=IMU
    export function readIMUAccx(): number {
        readAcc();
        return a[ZumoIMUDirection.X];
    }
    //% blockId=readIMUy
    //% block="read readIMUAccy "
    //% subcategory=IMU
    export function readIMUAccy(): number {
        readAcc();
        return a[ZumoIMUDirection.Y];
    }
    //% blockId=readIMUz
    //% block="read readIMUAccz "
    //% subcategory=IMU
    export function readIMUAccz(): number {
        readAcc();
        return a[ZumoIMUDirection.Z];
    }
    //% blockId=readIMUmx
    //% block="read readIMUMagx "
    //% subcategory=IMU
    export function readIMUMagx(): number {
        read();
        return m[ZumoIMUDirection.X];
    }
    //% blockId=readIMUmy
    //% block="read readIMUMagy "
    //% subcategory=IMU
    export function readIMUMagy(): number {
        read();
        return m[ZumoIMUDirection.Y];
    }
    //% blockId=readIMUmz
    //% block="read readIMUMagz "
    //% subcategory=IMU
    export function readIMUMagz(): number {
        read();
        return m[ZumoIMUDirection.Z];
    }
    //% blockId=readIMUgx
    //% block="read readIMUGyrox "
    //% subcategory=IMU
    export function readIMUGyrox(): number {
        read();
        return g[ZumoIMUDirection.X];
    }
    //% blockId=readIMUgy
    //% block="read readIMUGyroy "
    //% subcategory=IMU
    export function readIMUGyroy(): number {
        read();
        return g[ZumoIMUDirection.Y];
    }
    //% blockId=readIMUgz
    //% block="read readIMUGyroz "
    //% subcategory=IMU
    export function readIMUGyroz(): number {
        read();
        return g[ZumoIMUDirection.Z];
    }

}
