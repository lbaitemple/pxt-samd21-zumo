class I2C {
    writeTo(address: number, data: number[]): void {
        // Write implementation here
    }

    readFrom(address: number, count: number): number[] {
        // Read implementation here
        return [];
    }

    writeAccReg(reg: number, val: number): void {
        this.writeTo(0x32 >> 1, [reg, val]);
    }

    readAccReg(reg: number, count: number): number[] {
        // ORing 0x80 auto-increments the register for each read
        this.writeTo(0x32 >> 1, [reg | 0x80]);
        return this.readFrom(0x32 >> 1, count);
    }

    readAcc(): number[] {
        const d: number[] = this.readAccReg(0x29, 6);
        // Reconstruct 16-bit data
        const a: number[] = [
            d[0] | (d[1] << 8),
            d[2] | (d[3] << 8),
            d[4] | (d[5] << 8)
        ];
        // Deal with sign bit
        if (a[0] > 32767) a[0] -= 65536;
        if (a[1] > 32767) a[1] -= 65536;
        if (a[2] > 32767) a[2] -= 65536;
        return a;
    }
}

namespace zumo {
    // let i2cAddress = 0x19; // I2C address of the device

    //% blockId=MKL
    //% block="read MKL"
    //% subcategory=IMU
    export function readMKL(): number {
        const i2c = new I2C();
        i2c.writeAccReg(0x1d, 0x27); // turn Accelerometer on
        const a = i2c.readAcc();
        return a[2];
    }
}
