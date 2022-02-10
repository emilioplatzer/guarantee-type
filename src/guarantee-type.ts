
export type Values = 'string'|'number'|'boolean'|'bigint'|'symbol'

export type Description = {type:Values} | {[k in keyof {}] : Values}

export type GuaranteedType1<CurrentD> = {[K in keyof CurrentD] : GuaranteedType<CurrentD[K]>}

export type Opts = any;

export type GuaranteedType<CurrentD> = 
    CurrentD extends { string : Opts } ? string  :
    CurrentD extends { number : Opts } ? number  :
    CurrentD extends { boolean: Opts } ? boolean :
    // CurrentD extends infer T[keyof T] ?  {[k in keyof T] : GuaranteedType<K[T]>} :
    // CurrentD extends { [K in keyof CurrentD]: infer S} ?  {[K in keyof CurrentD] : GuaranteedType<CurrentD[K]>} :
    CurrentD extends { object: infer T} ? {[K in keyof T] : GuaranteedType<T[K]>} :
    unknown
// */    


var s: GuaranteedType<{value:'string'}>;
var n: GuaranteedType<{value:'number'}>;
var u: GuaranteedType<{value:string}>;

export function guarantee<CurrentD>(description:CurrentD, value:any):GuaranteedType<CurrentD>{
    // @ts-expect-error We know that description can't be == 'object'
    if ( description == 'object' ) throw new Error(`guarantee excpetion. Invalide description "object"`);
    // @ts-ignore
    if ( value && description != typeof value ) throw new Error(`guarantee excpetion. Value is not proper type`);
    return value;
}