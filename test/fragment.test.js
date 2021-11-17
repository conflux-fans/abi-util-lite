const { parseFragment, parseABIFromString } = require("../");
const { ContractABI } = require("../");
const expectedAbiJson = require("./Main.json").abi;

const { matchObjectWithDefault, matchOrderedArray, findAbiFragmentByName, matchFragment } = require("./utils")

expect.extend({
  matchObjectWithDefault(x, y, default_ = {}) {
    const result = matchObjectWithDefault(x, y, default_)
    return {
      pass: result.pass,
      message: () => result.message
    }
  },
});

expect.extend({
  matchOrderedArray(xarray, yarray, itemDefault = {}) {
    const result = matchOrderedArray(xarray, yarray, itemDefault)
    return {
      pass: result.pass,
      message: () => result.message
    }
  }
})

expect.extend({
  matchFragment(x, y) {
    const result = matchFragment(x, y)
    return {
      pass: result.pass,
      message: () => result.message
    }
  }
})

test("test matchObjectWithDefault api", () => {
  expect({ a: 1 }).matchObjectWithDefault({ a: 1, b: 2 }, { b: 2 });
  expect({ b: 2 }).matchObjectWithDefault({}, { b: 2 });
  expect({ a: 1, b: 2 }).matchObjectWithDefault({ a: 1 });
  expect({ a: 1, b: 2 }).matchObjectWithDefault(
    { a: 1, c: 3 },
    default_={ b: 2, c: 3 }
  );
});

test("test matchOrderedArray api", () => {
  expect([{ b: 2 }]).matchOrderedArray(
    [{}],
    default_ = { b: 2 })
  expect([{}, { b: 2 }]).not.matchOrderedArray(
    [{ a: 1 }, {}],
    itemDefault = { b: 2 }
  );
  expect([{ a: 1 }, { b: 2 }]).matchOrderedArray(
    [{ a: 1, b: 2 }, {}],
    itemDefault = { b: 2 }
  );
});

const ABIArray = [
  `constructor()`,
  `event Event(uint indexed a, bytes32 b)`,
  `event Event2(uint indexed a, bytes32 b)`,
  `error InsufficientBalance(uint256 available, uint256 required)`,
  `function foo(uint a) public`,
];


test("test constructor fragment", () => {
  const index = 0;
  const f = parseFragment(ABIArray[index]);
  expect(!!f.name).toBe(false)
  const expectedF = findAbiFragmentByName(expectedAbiJson, undefined)
  expect(expectedF).not.toBe(undefined)
  expect(f).matchFragment(expectedF)
});

test("test event fragment", () => {
  const index = 2;
  const f = parseFragment(ABIArray[index]);
  expect(!!f.name).toBe(true)
  const expectedF = findAbiFragmentByName(expectedAbiJson, f.name)
  expect(expectedF).not.toBe(undefined)
  expect(f).matchFragment(expectedF)
});

test("test constructor fragment", () => {
  const index = 4;
  const f = parseFragment(ABIArray[index]);
  expect(!!f.name).toBe(true)
  const expectedF = findAbiFragmentByName(expectedAbiJson, f.name)
  expect(expectedF).not.toBe(undefined)
  expect(f).matchFragment(expectedF)
});

test("test contractABI", ()=>{
  // let tmp = JSON.parse((new ContractABI(ABIArray)).format("json"))
  let tmp = parseABIFromString(ABIArray)
  for (let fragment of tmp) {
    // note: different fragments are identified by signature instead of fragment name
    //       here this api is used to identify for simplicity
    const expectedF = findAbiFragmentByName(expectedAbiJson, fragment.name)
    expect(!!expectedF).toBe(true)
    expect(!!fragment).toBe(true)
    expect(fragment).matchFragment(expectedF)
  }
})