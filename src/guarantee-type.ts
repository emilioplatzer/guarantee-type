
export type Values = 'string'|'number'|'boolean'|'bigint'|'symbol'

export type Opts = any;

export type Description = 
    { string : Opts } |
    { number : Opts } |
    { boolean: Opts } |
    { bigint : Opts } |
    { symbol : Opts } |
    { nullable: Description } |
    { optional: Description } |
    { object: {[K in keyof {}]: Description}};

export type GuaranteedType1<CurrentD> = {[K in keyof CurrentD] : GuaranteedType<CurrentD[K]>}

export type GuaranteedType<CurrentD> = 
    CurrentD extends { string : Opts } ? string  :
    CurrentD extends { number : Opts } ? number  :
    CurrentD extends { boolean: Opts } ? boolean :
    CurrentD extends { bigint : Opts } ? bigint  :
    CurrentD extends { symbol : Opts } ? symbol  :
    CurrentD extends { nullable: infer T } ? GuaranteedType<T>|null :
    CurrentD extends { optional: infer T } ? GuaranteedType<T>|null|undefined :
    CurrentD extends { object: infer T} ? {[K in keyof T] : GuaranteedType<T[K]>} :
    unknown
// */    


var s: GuaranteedType<{value:'string'}>;
var n: GuaranteedType<{value:'number'}>;
var u: GuaranteedType<{value:string}>;

export function guarantee<CurrentD extends Description>(description:CurrentD, value:any):GuaranteedType<CurrentD>{
    if ( "nullable" in description && value !== null )
        // @ts-expect-error: Type instantiation is excessively deep and possibly infinite.ts(2589) 
        return guarantee(description.nullable, value);
    if ( "optional" in description && value != null ) 
        return guarantee(description.optional, value);
    if ( typeof value != "object" && !(typeof value in description) ) throw new Error(`guarantee excpetion. Value is not proper type`);
    return value;
}