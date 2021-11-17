const { ParamType } = require("../");

test("parse param type with type and name", () => {
  let paramType = ParamType.fromString("address a");
  expect(paramType).toEqual(expect.objectContaining({
    type: "address",
    name: "a"
  }))
});

test("parse param type with type", () => {
  let paramType = ParamType.fromString("address");
  expect(paramType).toEqual(expect.objectContaining({
    type: "address"
  }))
});

test("parse param type array", () => {
  let paramType = ParamType.fromString("address[] a");
  // console.log(paramType)
  expect(paramType).toEqual(expect.objectContaining({
    type: "address[]",
    name: "a"
  }))
});

test("parse param type struct", () => {
  let paramType = ParamType.fromString("T[] a");
  expect(paramType).toEqual(expect.objectContaining({
    type: "T[]",
    name: "a"
  }))
});
