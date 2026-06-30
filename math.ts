// Add your code here
namespace zumo {
function toRadians(deg: number): number {
    return deg * Math.PI / 180
}
//% block="cos of %angle"
//% angle.defl=0
function toCosine(deg: number):number{
    return Math.cos(toRadians(deg))  // cos(45°)
}


//% block="sin of %angle"
//% angle.defl=0
function toSine(deg: number): number {
    return Math.sin(toRadians(deg))  // cos(45°)
}
}