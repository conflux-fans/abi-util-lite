import { logger } from "./Logger"

let ModifiersBytes: { [ name: string ]: boolean } = { calldata: true, memory: true, storage: true };
let ModifiersNest: { [ name: string ]: boolean } = { calldata: true, memory: true };
export function checkModifier(type: string, name: string): boolean {
  if (type === "bytes" || type === "string") {
      if (ModifiersBytes[name]) { return true; }
  } else if (type === "address") {
      if (name === "payable") { return true; }
  } else if (type.indexOf("[") >= 0 || type === "tuple") {
      if (ModifiersNest[name]) { return true; }
  }
  if (ModifiersBytes[name] || name === "payable") {
      logger.throwArgumentError("invalid modifier", "name", name);
  }
  return false;
}

export function verifyType(type: string): string {

  // These need to be transformed to their full description
  if (type.match(/^uint($|[^1-9])/)) {
    type = "uint256" + type.substring(4);
  } else if (type.match(/^int($|[^1-9])/)) {
    type = "int256" + type.substring(3);
  }

  // @TODO: more verification

  return type;
}

// See: https://github.com/ethereum/solidity/blob/1f8f1a3db93a548d0555e3e14cfc55a10e25b60e/docs/grammar/SolidityLexer.g4#L234
const regexIdentifier = new RegExp("^[a-zA-Z$_][a-zA-Z0-9$_]*$");
export function verifyIdentifier(value: string): string {
  if (!value || !value.match(regexIdentifier)) {
    logger.throwArgumentError(`invalid identifier "${value}"`, "value", value);
  }
  return value;
}

type StateInputValue = {
  constant?: boolean;
  payable?: boolean;
  stateMutability?: string;
  type?: string;
};

type StateOutputValue = {
  constant: boolean;
  payable: boolean;
  stateMutability: string;
};

export function verifyState(value: StateInputValue): StateOutputValue {
  let result: any = {
      constant: false,
      payable: true,
      stateMutability: "payable"
  };

  if (value.stateMutability != null) {
      result.stateMutability = value.stateMutability;

      // Set (and check things are consistent) the constant property
      result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
      if (value.constant != null) {
          if ((!!value.constant) !== result.constant) {
              logger.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
          }
      }

      // Set (and check things are consistent) the payable property
      result.payable = (result.stateMutability === "payable");
      if (value.payable != null) {
          if ((!!value.payable) !== result.payable) {
              logger.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
          }
      }

  } else if (value.payable != null) {
      result.payable = !!value.payable;

      // If payable we can assume non-constant; otherwise we can't assume
      if (value.constant == null && !result.payable && value.type !== "constructor") {
          logger.throwArgumentError("unable to determine stateMutability", "value", value);
      }

      result.constant = !!value.constant;

      if (result.constant) {
          result.stateMutability = "view";
      } else {
          result.stateMutability = (result.payable ? "payable": "nonpayable");
      }

      if (result.payable && result.constant) {
          logger.throwArgumentError("cannot have constant payable function", "value", value);
      }

  } else if (value.constant != null) {
      result.constant = !!value.constant;
      result.payable = !result.constant;
      result.stateMutability = (result.constant ? "view": "payable");

  } else if (value.type !== "constructor") {
      logger.throwArgumentError("unable to determine stateMutability", "value", value);
  }

  return result;
}
