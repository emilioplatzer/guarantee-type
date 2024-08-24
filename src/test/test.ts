import { Description, Opts, guarantee, guaranteeOnError, throwAllErrorsInAString, consoleErrorAllErrors, ignoreAllErrors,
    is, nullOpts, DefinedType
} from "../lib/guarantee-type";

import * as assert from "assert";
import { IpcSocketConnectOpts } from "net";

var opts:Opts;

class ExampleForTest{}

describe("internal representation of is", function(){
    it("boolean", function(){
        assert.deepEqual(is.boolean, {boolean: nullOpts})
    })
    it("nullable", function(){
        assert.deepEqual(is.nullable.string, {nullable:{string: nullOpts}})
    })
    it("optional", function(){
        assert.deepEqual(is.optional.number, {optional:{number: nullOpts}})
    })
    it("class", function(){
        assert.deepEqual(is.class(ExampleForTest), {class:ExampleForTest})
    })
    it("Date", function(){
        assert.deepEqual(is.Date, {class:Date})
    })
    it("object", function(){
        assert.deepEqual(is.object({
            name:is.string,
            age:is.optional.number,
            born:is.Date
        }), {object:{
            name:{string: nullOpts},
            age:{optional:{number: nullOpts}},
            born:{class:Date}
        }})
    })
    it("string[]", function(){
        assert.deepEqual(is.array.string, {array:{string: nullOpts}});
    })
    it("(bigint|null)[]", function(){
        assert.deepEqual(is.array.nullable.bigint, {array:{nullable:{bigint: nullOpts}}});
        var x: DefinedType<typeof is.array.nullable.bigint> = [];
        var y: (bigint|null)[] = [];
        // @ts-expect-error x is not any
        var n:null = x;
        x=y;
        y=x; 
    })
    it("string[]|null", function(){
        assert.deepEqual(is.nullable.array.string, {nullable:{array:{string: nullOpts}}});
        var x:DefinedType<typeof is.nullable.array.string>
        var y: string[]|null = [];
        // @ts-expect-error x is not any
        var n:null = x;
        x=y;
        y=x; 
    })
    it("optional object", function(){
        var description = is.optional.object({name:is.string});
        assert.deepEqual(description, {optional:{object:{name: {string:nullOpts}}, optionals:{}}})
        var resultNull = guarantee(description, null)
        assert.deepEqual(resultNull, null);
        var resultOk = guarantee(description, {name:'the name'});
        assert.deepEqual(resultOk, {name:'the name'});
    })
    it("{}[]", function(){
        var description = is.array.object({name:is.string});
        assert.deepEqual(description, {array:{object:{name: {string:nullOpts}}}})
        var resultOk = guarantee(description, [{name:'the name'}, {name:'name'}]);
        assert.deepEqual(resultOk, [{name:'the name'}, {name:'name'}]);
    })
})

describe("guarantee",function(){
    describe("values",function(){
        it("string", function(){
            var result:string; 
            var value:any = "any string";
            result = guarantee({string:opts}, value);
            assert.equal(result, value);
            result = guarantee(is.string, value);
            assert.equal(result, value);
        })
        it("detects TypeError string cannot be asigned to number", function(){
            var resultN:number = 0; 
            var value:any = "any string";
            // @ts-expect-error
            resultN = guarantee({string:opts}, value);
            // @ts-expect-error
            resultN = guarantee(is.string, value);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(resultN, "any string");
            // @ts-expect-error
            var resultS:string = guarantee({number:opts}, 42);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(resultS, 42);
            assert.notStrictEqual(resultS, "42");
        })
        it("number cannot be assigned to string", function(){
            var value:any = 43;
            assert.throws(()=>guarantee({string:opts}, value), /guarantee excpetion. Value is not "string"/);
            assert.throws(()=>guarantee(is.string, undefined), /guarantee excpetion. Value is undefined but type is not nullable/);
        })
        it("can set a optional variable", function(){
            var value:any = null;
            var result:boolean|null|undefined = guarantee({optional:{boolean:opts}}, value);
            assert.strictEqual(result, value)
            var optional = guarantee(is.optional.boolean, value);
            optional = result;
            assert.strictEqual(optional, value)
        })
        it("can set a optional property", function(){
            var value:{sure:boolean, maybe?:boolean} = {sure:true};
            var result:{sure:boolean, maybe?:boolean} = guarantee({object:{sure:{boolean:opts}}, optionals:{maybe:{boolean:opts}}}, value);
            assert.strictEqual(result, value)
            var result2 = guarantee(is.object({sure:is.boolean}, {maybe:is.optional.boolean}), value);
            result2 = result;
            assert.strictEqual(result2, value)
        })
        it("detects TypeError can set a optional variable", function(){
            var value:any = true;
            // @ts-expect-error
            var result:boolean|null = guarantee({optional:{boolean:opts}}, value);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(result, true);
        })
        it("can set a nullable variable", function(){
            var value:any = null;
            var result:boolean|null = guarantee({nullable:{boolean:opts}}, value);
            assert.strictEqual(result, value)
        })
        it("detects TypeError can set a nullable variable", function(){
            var value:any = true;
            // @ts-expect-error
            var result:boolean = guarantee({nullable:{boolean:opts}}, value);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(result, true);
        })
        it("invalid type in description", function(){
            var value:any = 8.8;
            var badDescription = {float8:opts} as unknown as Description // Bad description
            assert.throws(function(){
                guarantee(badDescription, value)
            }, /float8 is not a valid type/);
        })
    });
    describe("objects like Record<string, value>", function(){
        var description1 = {object: {
            name: { string : opts },
            age:  { number : opts },
            ready:{ boolean: opts },
        }}
        var description1is = is.object({
            name: is.string ,
            age:  is.number ,
            ready:is.boolean,
        })
        type Type1 = {
            name: string
            age: number
            ready: boolean
        }
        var value1 = {
            name: 'Abigail',
            age: 72,
            ready: true,
        }
        type Type2 = {
            name: string
            born: Date
        }
        it("detects TypeError", function(){
            var result: Type2
            // @ts-expect-error
            result = guarantee(description1, value1);
            // @ts-expect-error
            result = guarantee(description1is, value1);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.deepStrictEqual(result, value1);
        })
        it("receive a good object", function(){
            var result: Type1
            result = guarantee(description1, value1 );
            assert.equal(result, value1);
            var result2 = guarantee(description1is, value1 );
            assert.equal(result2, value1);
            // @ts-expect-error Esto está puesto para evitar que result2 sea null y esto lo detectaría al permitir asignar cualquier cosa.
            result2 = {name:1, age:1, ready:1}
        })
        it("rejects a bad object", function(){
            var value = {
                name: "Pedro",
                age: "43",
                ready: "yes"
            }
            assert.throws(()=>guarantee(description1, value ), /guarantee excpetion. Value\.age is not "number".* Value\.ready is not "boolean"/);
        })
        it("rejects a bad object", function(){
            var value = {
                name: "Pedro",
                age: null,
                ready: null
            }
            assert.throws(()=>guarantee(description1, value ), /guarantee excpetion. Value\.age is null but type is not nullable/);
        })
    })
    describe("object with more than one level", function(){
        it("rejects deeply", function(){
            var description = {object:{alpha:{object:{betha:{string:opts}}}}}
            assert.throws(()=>guarantee(description, {alpha:{betha:false}} ), /guarantee excpetion. Value\.alpha\.betha is not "string"/);
        })
        it("accepts complex object", function(){
            var description = {object:{alpha:{object:{betha:{string:opts},gamma:{number:opts}}}}}
            var value = {alpha:{betha:'x', gamma:1}}
            var result:{alpha:{betha:string, gamma:number}} = guarantee(description, value);
            assert.deepStrictEqual(result, value);
        })
    })
    describe("array", function(){
        it("accept array", function(){
            var description = {array:{boolean:opts}};
            var result:boolean[] = guarantee(description, [true, false]);
            var autoResult = guarantee(is.array.boolean, [true, false]); // to ensure not 'any'
            // @ts-expect-error
            var wrongResult:string[] = autoResult // if the previous return 'any' this don't detect the error
            var autoResult2 = guarantee(is.array.optional.boolean, [true, false]); // to ensure not 'any'
            var rightResult2:(boolean|undefined|null)[] = autoResult2
            // @ts-expect-error
            var wrongResult2:boolean[] = autoResult2 // if the previous return 'any' this don't detect the error
        })
        it("rejects non array", function(){
            var description = {array:{boolean:opts}};
            assert.throws(()=>guarantee(description, true), /guarantee excpetion. Value is not an array and must be/);
        })
        it("rejects wrong element", function(){
            var description = {array:{boolean:opts}};
            assert.throws(()=>guarantee(description, [true,'one']), /guarantee excpetion. Value\[1\] is not "boolean"/);
        })
        it("rejects wrong element in an object with array", function(){
            var description = {object:{omega:{array:{boolean:opts}}}};
            assert.throws(()=>guarantee(description, {omega:[[]]}), /guarantee excpetion. Value\.omega\[0\] is not "boolean"/);
        })
        it("rejects non array in object", function(){
            var description = {object:{omega:{array:{boolean:opts}}}};
            assert.throws(()=>guarantee(description, {omega:false}), /guarantee excpetion. Value\.omega is not an array and must be/);
        })
    })
    describe("recordString", function(){
        it("accept recordString", function(){
            var description = {recordString:{boolean:opts}};
            var result:Record<string, boolean> = guarantee(description, {yes:true, no:false});
            var autoResult = guarantee(is.recordString.boolean, {yes:true, no:false}); // to ensure not 'any'
            // @ts-expect-error
            var wrongResult:Record<string, string> = autoResult // if the previous return 'any' this don't detect the error
            var autoResult2 = guarantee(is.recordString.optional.boolean, {yes:true, no:false}); // to ensure not 'any'
            var rightResult2:Record<string, (boolean|undefined|null)> = autoResult2
            // @ts-expect-error
            var wrongResult2:Record<string, boolean> = autoResult2 // if the previous return 'any' this don't detect the error
        })
        it("rejects non recordString", function(){
            var description = {recordString:{boolean:opts}};
            assert.throws(()=>guarantee(description, true), /guarantee excpetion. Value is not a Record<string,T> and must be/);
        })
        it("rejects wrong element", function(){
            var description = {array:{boolean:opts}};
            assert.throws(()=>guarantee(description, [true,'one']), /guarantee excpetion. Value\[1\] is not "boolean"/);
        })
        it("rejects wrong element in an object with recordString", function(){
            var description = {object:{omega:{recordString:{boolean:opts}}}};
            assert.throws(()=>guarantee(description, {omega:{one:[]}}), /guarantee excpetion. Value\.omega\[one\] is not "boolean"/);
        })
        it("rejects non recordString in object", function(){
            var description = {object:{omega:{recordString:{boolean:opts}}}};
            assert.throws(()=>guarantee(description, {omega:false}), /guarantee excpetion. Value\.omega is not a Record<string,T> and must be/);
        })
    })
    describe("union", function(){
        it("accepts any type with the first value", function(){
            var result: string|number;
            var any:any = "x";
            result = guarantee({union: [{string:opts},{number:opts}]}, any);
            assert.strictEqual(result, any);
        })
        it("accepts any type with the second value", function(){
            var result: string|number;
            var any:any = 42;
            result = guarantee({union: [{string:opts},{number:opts}]}, any);
            assert.strictEqual(result, any);
        })
        it("accepts any type with the last value", function(){
            var result: string|number|{}|boolean;
            var any:any = true;
            result = guarantee(is.union([is.string,is.number,is.object({}),is.boolean]), any);
            assert.strictEqual(result, any);
        })
        it("reject wrong type", function(){
            var any:any = false;
            assert.throws(()=>guarantee({union: [{string:opts},{number:opts}]}, any),/guarantee excpetion. Value\(in union\) is not "string", Value\(in union\) is not "number"/);
        })
    })
    describe("literal", function(){
        it("accept literal number", function(){
            var result: 42;
            var any:any = 42;
            result = guarantee({literal: 42 as 42}, any);
            assert.strictEqual(result, any);
        })
        it("rejects other literal number", function(){
            var result: 43;
            var any:any = 43;
            assert.throws(()=>{
                // @ts-expect-error 42 is not 43
                result = guarantee({literal: 42 as 42}, any);
            })
        })
        it("accept literal in union", function(){
            var result: "one"|"two";
            var any:any = "one";
            result = guarantee(is.union([is.literal("one" as "one"), is.literal("two" as "two")]), any);
            assert.strictEqual(result, any);
        })
    })
    describe("configurable on error", function(){
        afterEach(function(){
            guaranteeOnError(throwAllErrorsInAString);
        })
        it("can use any error", function(){
            var description = {union:[{string:opts},{object:{x:{number:opts}}}]}
            var viewed:string[] = ["x"];
            function anyError(errors:string[]){
                viewed = errors;
            }
            var any:any = false;
            guaranteeOnError(anyError)
            var result:string|{x:number} = guarantee(description, any);
            assert.deepStrictEqual(viewed, [
                "Value(in union) is not \"string\"",
                "Value(in union).x is undefined but type is not nullable"
            ])
        })
        it("can log error", function(){
            guaranteeOnError(consoleErrorAllErrors)
            guarantee({boolean:opts}, 1);
            guarantee({boolean:opts}, false);
        })
        it("can ignore error", function(){
            guaranteeOnError(ignoreAllErrors)
            guarantee({boolean:opts}, 1);
        })
    })
    describe("class values", function(){
        it("receives Date", function(){
            var description = {class: Date};
            var result:Date;
            var value = new Date(1969,5,6)
            result = guarantee(description, value);
            assert.strictEqual(result, value)
        })
        it("receives is.Date", function(){
            var description = is.Date;
            var result:Date;
            var value = new Date(1969,5,6)
            result = guarantee(description, value);
            assert.strictEqual(result, value)
        })
        it("rejects non Date", function(){
            var description = {class: Date};
            var result:Date;
            var value = 52;
            assert.throws(()=>{
                result = guarantee(description, value);
            },/guarantee excpetion. Value is not "Date"/)
        })
        it("detects invalid class", function(){
            var description = {object:{due:{class: Date}, pattern:{class:RegExp}, other:{class:RegExp}}};
            var result:{due:Date, pattern:RegExp, other:Date} = {due:new Date(), pattern:/not/, other:new Date()}
            var value = {due:new Date(), pattern:/mm-dd-yyyy/, other:new Date()};
            assert.throws(()=>{
                // @ts-expect-error INVALID CLASS
                result = guarantee(description, value);
            },/guarantee excpetion. Value.other is not "RegExp"/);
            assert.notDeepEqual(value, result);
        })
        it("works with dates in an object", function(){
            var description = is.object({
                name: is.string,
                birthdate: is.Date,
                age: is.number
            });
            var result: {name:string, birthdate: Date, age: number};
            function nullObject<T extends Description>(description:T):DefinedType<T>{
                // @ts-expect-error this is a naive implementation. 
                var result: DefinedType<T> = {}
                for (var key in description) {
                    result[key] = null;
                }
                return result;
            }
            var obtained = nullObject(description);
            // @ts-expect-error It expects that birthdate is not any
            var no_number:number = obtained.birthdate;
            result = obtained;
        })
    })
})
