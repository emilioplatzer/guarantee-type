import { Description, guarantee } from "../src/guarantee-type";

import * as assert from "assert"

describe("guarantee",function(){
    it("string", function(){
        var result:string; 
        var value:any = "any string";
        result = guarantee("string", value);
        assert.equal(result, value);
    })
    it("string returns string", function(){
        var result:number; 
        var value:any = "any string";
        // @ts-expect-error
        result = guarantee("string", value);
    })
    it("number cannot be assigned to string", function(){
        var value:any = 43;
        assert.throws(()=>guarantee("string", value), /guarantee excpetion. Value is not proper type/);
    })
})
