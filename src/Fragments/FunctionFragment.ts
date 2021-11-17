import { logger, Logger } from "../Logger"
import { ParamType, parseParams } from "../ParamType"
import { Fragment, _Fragment, parseModifiers, regexParen } from "./Fragments"
import { _ConstructorFragment, ConstructorFragment } from "./ConstructorFragment"
import { JsonFragmentType, JsonFragment } from "../SharedInterface";
import { verifyState, verifyIdentifier } from "../Checkers";
import { defineReadOnly, populate, _constructorGuard, TypeCheck } from "../Utils";
import { FormatTypes } from "../Format";

interface _FunctionFragment extends _ConstructorFragment {
  constant: boolean;
  outputs?: Array<ParamType>;
}

export class FunctionFragment extends ConstructorFragment {
  constant: boolean;
  outputs?: Array<ParamType>;

  static from(value: FunctionFragment | JsonFragment | string): FunctionFragment {
    if (typeof (value) === "string") {
      return FunctionFragment.fromString(value);
    }
    return FunctionFragment.fromObject(value);
  }

  format(format?: string): string {
    if (!format) { format = FormatTypes.sighash; }
    if (!FormatTypes[format]) {
      logger.throwArgumentError("invalid format type", "format", format);
    }

    if (format === FormatTypes.json) {
      return JSON.stringify({
        type: "function",
        name: this.name,
        constant: this.constant,
        stateMutability: this.stateMutability,
        payable: this.payable, 
        // gas: (this.gas ? this.gas.toNumber(): undefined),
        inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
        outputs: this.outputs.map((output) => JSON.parse(output.format(format))),
      });
    }

    let result = "";

    if (format !== FormatTypes.sighash) {
      result += "function ";
    }

    result += this.name + "(" + this.inputs.map(
      (input) => input.format(format)
    ).join((format === FormatTypes.full) ? ", " : ",") + ") ";

    if (format !== FormatTypes.sighash) {
      if (this.stateMutability) {
        if (this.stateMutability !== "nonpayable") {
          result += (this.stateMutability + " ");
        }
      } else if (this.constant) {
        result += "view ";
      }

      if (this.outputs && this.outputs.length) {
        result += "returns (" + this.outputs.map(
          (output) => output.format(format)
        ).join(", ") + ") ";
      }

      // if (this.gas != null) {
      //     result += "@" + this.gas.toString() + " ";
      // }
    }

    return result.trim();
  }

  static fromObject(value: FunctionFragment | JsonFragment): FunctionFragment {
    if (FunctionFragment.isFunctionFragment(value)) { return value; }

    if (value.type !== "function") {
      logger.throwArgumentError("invalid function object", "value", value);
    }

    let state = verifyState(value);

    const params: TypeCheck<_FunctionFragment> = {
      type: value.type,
      name: verifyIdentifier(value.name),
      constant: state.constant,
      inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
      outputs: (value.outputs ? value.outputs.map(ParamType.fromObject) : []),
      payable: state.payable,
      stateMutability: state.stateMutability,
    };

    return new FunctionFragment(_constructorGuard, params);
  }

  static fromString(value: string): FunctionFragment {
    let params: any = { type: "function" };

    let comps = value.split(" returns ");
    if (comps.length > 2) {
      logger.throwArgumentError("invalid function string", "value", value);
    }

    let parens = comps[0].match(regexParen);
    if (!parens) {
      logger.throwArgumentError("invalid function signature", "value", value);
    }

    params.name = parens[1].trim();
    if (params.name) { verifyIdentifier(params.name); }

    params.inputs = parseParams(parens[2], false);

    parseModifiers(parens[3].trim(), params);

    // We have outputs
    if (comps.length > 1) {
      let returns = comps[1].match(regexParen);
      if (returns[1].trim() != "" || returns[3].trim() != "") {
        logger.throwArgumentError("unexpected tokens", "value", value);
      }
      params.outputs = parseParams(returns[2], false);
    } else {
      params.outputs = [];
    }
    return FunctionFragment.fromObject(params);
  }

  static isFunctionFragment(value: any): value is FunctionFragment {
    return (value && value._isFragment && value.type === "function");
  }
}