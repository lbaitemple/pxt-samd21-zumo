// Add your code here
namespace zumo {
function toRadians(deg: number): number {
    return deg * Math.PI / 180
}


//% blockId=cosfunc
//% block="cos %deg"
//% deg.defl=0
 //% subcategory=Math
 //% group="trig"
export function toCosine(deg: number):number{
    return Math.cos(toRadians(deg))  // cos(45°)
}

//% blockId=sinfunc
//% block="sin %deg"
//% deg.defl=0
 //% subcategory=Math
//% group="trig"
export function toSine(deg: number): number {
    return Math.sin(toRadians(deg))  // cos(45°)
}
}