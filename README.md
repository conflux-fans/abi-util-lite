# abi-util-lite

This is a light implementation to parse abi string to abi fragment.

## install

```bash
npm install --save abi-util-lite
```

## usage

```js
const { parseABIFromString } = require('abi-util-lite')

const ABIArray = [
  `constructor()`,
  `event Event(uint indexed a, bytes32 b)`,
  `event Event2(uint indexed a, bytes32 b)`,
  `error InsufficientBalance(uint256 available, uint256 required)`,
  `function foo(uint a) public`,
];

let tmp = parseABIFromString(ABIArray)
console.log(tmp)
```

# TODO

- [ ] struct support
<!-- - [ ]  -->
