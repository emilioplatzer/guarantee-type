
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
    { object: {[K in keyof any]: Description} } | 
    { array: Description } | 
    { union: {1:Description, 2:Description} | {1:Description, 2:Description, 3:Description} } |
    { class: Function }

export type Constructor<T> = new(...args: any[]) => T;

export type GuaranteedType<CurrentD> = 
    CurrentD extends { string : Opts } ? string  :
    CurrentD extends { number : Opts } ? number  :
    CurrentD extends { boolean: Opts } ? boolean :
    CurrentD extends { bigint : Opts } ? bigint  :
    CurrentD extends { symbol : Opts } ? symbol  :
    CurrentD extends { nullable: infer T } ? GuaranteedType<T>|null :
    CurrentD extends { optional: infer T } ? GuaranteedType<T>|null|undefined :
    CurrentD extends { object: infer T} ? {[K in keyof T] : GuaranteedType<T[K]>} :
    CurrentD extends { array: infer T} ? GuaranteedType<T>[] :
    CurrentD extends { union: {1:infer T1, 2:infer T2}} ? GuaranteedType<T1> | GuaranteedType<T2> :
    CurrentD extends { union: {1:infer T1, 2:infer T2, 3:infer T3}} ? GuaranteedType<T1> | GuaranteedType<T2> | GuaranteedType<T3> :
    CurrentD extends { class: infer T } ? ( T extends Constructor<any> ? InstanceType<T> : unknown ) : 
    unknown

export function valueGuarantor(type:Values){
    return function guarantor(opts:Opts, value:any, path:string, errors:string[]){
        if ( (typeof value != type) ) errors.push(`${path} is not "${type}"`);
    }
}

export var errorTypeFinder = {
    // nullable: function(){},
    // optiontal: function(){},
    string :valueGuarantor('string'),
    number :valueGuarantor('number'),
    boolean:valueGuarantor('boolean'),
    bigint :valueGuarantor('bigint'),
    symbol :valueGuarantor('symbol'),
    object: function(innerDescription:{[K:string] : Description}, value:any, path:string, errors:string[]){
        for ( var a in innerDescription ){
            findErrorsInTypes(innerDescription[a], value[a], path+'.'+a, errors);
        }
    },
    array: function(innerDescription:Description, value:any, path:string, errors:string[]){
        if(value instanceof Array){
            for ( var i = 0; i < value.length; i++ ){
                findErrorsInTypes(innerDescription, value[i], path+`[${i}]`, errors);
            }
        }else errors.push(`${path} is not an array and must be`);
    },
    union: function(descriptions:Description[], value:any, path:string, errors:string[]){
        var incompatibilities:string[] = []; 
        /* array implementation:
        for(var i=0; i<descriptions.length; i++){
            findErrorsInTypes(descriptions[i], value, `${path}(in union)`, incompatibilities);
            if(incompatibilities.length == i) return;
        }
        */
        var step = 0;
        for(var n in descriptions){
            findErrorsInTypes(descriptions[n], value, `${path}(in union)`, incompatibilities);
            if(step++ == incompatibilities.length) return;
        }
        for(var i=0; i<incompatibilities.length; i++) errors.push(incompatibilities[i]);
    },
    class: function guarantor(classConstructor:Function, value:any, path:string, errors:string[]){
        if ( !(value instanceof classConstructor) ) errors.push(`${path} is not "${
            /* istanbul ignore next */
            classConstructor.name??'class'
        }"`);
    }
}

function findErrorsInTypes<CurrentD extends Description>(description:CurrentD, value:any, path:string, errors:string[]):void{
    if ( "nullable" in description ){
        if ( value === null ) return value
        else
            return findErrorsInTypes(description.nullable, value, path, errors);
    }else if ( "optional" in description){
        if ( value == null ) return value
        else
            return findErrorsInTypes(description.optional, value, path, errors);
    }else{
        if ( value == null ) errors.push(`${path} is ${value} but type is not nullable`)
        else 
        for(var firstTag in description){
            if(firstTag in errorTypeFinder){
                var theTag = firstTag as unknown as keyof typeof errorTypeFinder;
                errorTypeFinder[theTag](description[firstTag], value, path, errors);
            }else{
                errors.push(`${firstTag} is not a valid type`)
            }
            return ;
        }
    }
}

export function throwAllErrorsInAString(errors:string[]){
    if(errors.length) throw new Error(`guarantee excpetion. ${errors.join(', ')}`);
}

export function consoleErrorAllErrors(errors:string[]){
    if(errors.length) console.error(`guarantee errors.`,errors);
}

export function ignoreAllErrors(errors:string[]){
}

var guaranteeOnErrorListener:(errors:string[]) => void = throwAllErrorsInAString;

export function guaranteeOnError(fun:(errors:string[]) => void){
    guaranteeOnErrorListener = fun;
}

export function guarantee<CurrentD extends Description>(description:CurrentD, value:any):GuaranteedType<CurrentD>{
    var errors:string[] = []
    findErrorsInTypes(description, value, 'Value', errors);
    guaranteeOnErrorListener(errors);
    return value;
}
