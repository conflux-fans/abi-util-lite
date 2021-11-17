pragma solidity = 0.8.4;

// example from https://docs.soliditylang.org/en/v0.8.10/abi-spec.html
contract Main {
    constructor(){}
  event Event(uint indexed a, bytes32 b);
  event Event2(uint indexed a, bytes32 b);
  error InsufficientBalance(uint256 available, uint256 required);
  function foo(uint a) public{}
}