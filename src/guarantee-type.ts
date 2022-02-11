
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
    { object: {[K in keyof any]: Description}};

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

export function guarantee<CurrentD extends Description>(description:CurrentD, value:any, path?:string):GuaranteedType<CurrentD>{
    if ( "nullable" in description ){
        if ( value === null ) return value
        else
        // @ts-expect-error: Type instantiation is excessively deep and possibly infinite.ts(2589) 
            return guarantee(description.nullable, value, path);
    }else if ( "optional" in description){
        if ( value == null ) return value
        else
            return guarantee(description.optional, value, path);
    }else{
        if ( value == null ) throw new Error(`guarantee excpetion. ${path??'Value'} is ${value} but type is not nullable`);
        if ( "object" in description ){
            for ( var a in description.object ){
                guarantee(description.object[a], value[a], (path?path+',':'')+a);
            }
        }else{
            if ( !(typeof value in description) ) throw new Error(`guarantee excpetion. ${path??'Value'} is not proper type`);
        }
    }
    return value;
}