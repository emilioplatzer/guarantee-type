import { Description, Opts, guarantee } from "../src/guarantee-type";

import * as assert from "assert";

var opts:Opts;

describe("guarantee",function(){
    describe("values",function(){
        it("string", function(){
            var result:string; 
            var value:any = "any string";
            result = guarantee({string:opts}, value);
            assert.equal(result, value);
        })
        it("detects TypeError string cannot be asigned to number", function(){
            var result:number; 
            var value:any = "any string";
            // @ts-expect-error
            result = guarantee({string:opts}, value);
            // @ts-expect-error
            var results:string = guarantee({number:opts}, value);
        })
        it("number cannot be assigned to string", function(){
            var value:any = 43;
            assert.throws(()=>guarantee({string:opts}, value), /guarantee excpetion. Value is not proper type/);
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
            // @ts-expect-error
            result = guarantee(description1, value1);
        })
        it("receive a Record<string, value>", function(){
            var result: Type1
            result = guarantee(description1, value1 );
            assert.equal(result, value1);
        })
    })
})
