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
    return Math.cos(toRadians(deg))  
}

//% blockId=sinfunc
//% block="sin %deg"
//% deg.defl=0
 //% subcategory=Math
//% group="trig"
export function toSine(deg: number): number {
    return Math.sin(toRadians(deg))  
}

    //% blockId=sqrtfunc
    //% block="sqrt %num"
    //% num.defl=0
    //% subcategory=Math
    //% group="trig"
    export function toSqrt(num: number): number {
        return Math.sqrt(num)  
    }
    
    //% blockId=distfunc
    //% block="dist %a %b"
    //% a.defl=0
    //% b.defl=0
    //% subcategory=Math
    //% group="trig"
    export function toDist(a: number, b: number): number {
        return Math.sqrt(a^2 + b^2)  ;
    }
}