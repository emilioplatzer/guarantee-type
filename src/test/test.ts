import { Description, Opts, guarantee, guaranteeOnError, throwAllErrorsInAString, consoleErrorAllErrors, ignoreAllErrors,
    DefinedType
} from "../lib/guarantee-type";

import * as assert from "assert";

var opts:Opts;

class ExampleForTest{}

describe("guarantee",function(){
    describe("values",function(){
        it("string", function(){
            var result:string; 
            var value:any = "any string";
            result = guarantee({string:opts}, value);
            assert.equal(result, value);
        })
        it("detects TypeError string cannot be asigned to number", function(){
            var resultN:number = 0; 
            var value:any = "any string";
            // @ts-expect-error Ok: Type 'string' is not assignable to type 'number'.
            resultN = guarantee({string:opts}, value);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(resultN, "any string");
            // @ts-expect-error Ok: Type 'number' is not assignable to type 'string'.
            var resultS:string = guarantee({number:opts}, 42);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(resultS, 42);
            assert.notStrictEqual(resultS, "42");
        })
        it("number cannot be assigned to string", function(){
            var value:any = 43;
            assert.throws(()=>guarantee({string:opts}, value), /guarantee excpetion. Value is not "string"/);
        })
        it("can set a optional variable", function(){
            var value:any = null;
            var result:boolean|null|undefined = guarantee({optional:{boolean:opts}}, value);
            assert.strictEqual(result, value)
        })
        it("detects TypeError can set a optional variable", function(){
            var value:any = true;
            // @ts-expect-error Ok: Type 'boolean | null | undefined' is not assignable to type 'boolean | null'.
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
            // @ts-expect-error Ok: Type 'boolean | null' is not assignable to type 'boolean'.
            var result:boolean = guarantee({nullable:{boolean:opts}}, value);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(result, true);
        })
        it("invalid type in description", function(){
            var value:any = 8.8;
            var badDescription = {float8:opts};
            assert.throws(function(){
                // @ts-expect-error Ok: Argument of type '{ float8: Opts; }' is not assignable to parameter of type 'Description'.
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
            // @ts-expect-error Ok: Property 'born' is missing in type '{ name: string; age: number; ready: boolean; }' but required in type 'Type2'.
            result = guarantee(description1, value1);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.deepStrictEqual(result, value1);
        })
        it("receive a good object", function(){
            var result: Type1
            result = guarantee(description1, value1 );
            assert.equal(result, value1);
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
                // @ts-expect-error 42 is not 43 Ok: Type '42' is not assignable to type '43'.
                result = guarantee({literal: 42 as 42}, any);
            })
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
                // @ts-expect-error Ok: Type '{ due: Date; pattern: RegExp; other: RegExp; }' is not assignable to type '{ due: Date; pattern: RegExp; other: Date; }'.
                result = guarantee(description, value);
            },/guarantee excpetion. Value.other is not "RegExp"/);
            assert.notDeepEqual(value, result);
        })
    })
    describe("optional assignations", function(){
        var description = {object: {name:{string: opts}, age:{optional:{number:opts}}}}
        type ExpectedType = {name: string, age?:number}
        var value = {name:'me'}
        var obtained = guarantee(description, value);
        var obtainedValue:ExpectedType = obtained;
        assert.deepEqual(obtainedValue, value);
    })
})
