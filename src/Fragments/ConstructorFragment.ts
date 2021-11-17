import { logger, Logger } from "../Logger"
import { ParamType, parseParams } from "../ParamType"
import { Fragment, _Fragment, parseModifiers, regexParen } from "./Fragments"
import { JsonFragmentType, JsonFragment } from "../SharedInterface";
import { verifyState } from "../Checkers";
import { defineReadOnly, populate, _constructorGuard, TypeCheck } from "../Utils";
import { FormatTypes } from "../Format";

export interface _ConstructorFragment extends _Fragment {
  stateMutability: string;
  payable: boolean;
  // gas?: BigNumber;
}

export class ConstructorFragment extends Fragment {
  stateMutability!: string;
  payable!: boolean;
  // gas?: BigNumber;

  format(format?: string): string {
    if (!format) { format = FormatTypes.sighash; }
    if (!FormatTypes[format]) {
      logger.throwArgumentError("invalid format type", "format", format);
    }

    if (format === FormatTypes.json) {
      return JSON.stringify({
        type: "constructor",
        stateMutability: this.stateMutability,
        // payable: this.payable,
        inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
      });
    }

    if (format === FormatTypes.sighash) {
      logger.throwError("cannot format a constructor for sighash", Logger.errors.UNSUPPORTED_OPERATION, {
        operation: "format(sighash)"
      });
    }

    let result = "constructor(" + this.inputs.map(
      (input) => input.format(format)
    ).join((format === FormatTypes.full) ? ", " : ",") + ") ";

    if (this.stateMutability && this.stateMutability !== "nonpayable") {
      result += this.stateMutability + " ";
    }

    return result.trim();
  }

  static from(value: ConstructorFragment | JsonFragment | string): ConstructorFragment {
    if (typeof (value) === "string") {
      return ConstructorFragment.fromString(value);
    }
    return ConstructorFragment.fromObject(value);
  }

  static fromObject(value: ConstructorFragment | JsonFragment): ConstructorFragment {
    if (ConstructorFragment.isConstructorFragment(value)) { return value; }

    if (value.type !== "constructor") {
      logger.throwArgumentError("invalid constructor object", "value", value);
    }

    let state = verifyState(value);
    if (state.constant) {
      logger.throwArgumentError("constructor cannot be constant", "value", value);
    }

    const params: TypeCheck<_ConstructorFragment> = {
      name: null,
      type: value.type,
      inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
      payable: state.payable,
      stateMutability: state.stateMutability,
      // gas: (value.gas ? BigNumber.from(value.gas): null)
    };

    return new ConstructorFragment(_constructorGuard, params);
  }

  static fromString(value: string): ConstructorFragment {
    let params: any = { type: "constructor" };

    // value = parseGas(value, params);

    let parens = value.match(regexParen);
    if (!parens || parens[1].trim() !== "constructor") {
      logger.throwArgumentError("invalid constructor string", "value", value);
    }

    params.inputs = parseParams(parens[2].trim(), false);

    parseModifiers(parens[3].trim(), params);

    return ConstructorFragment.fromObject(params);
  }

  static isConstructorFragment(value: any): value is ConstructorFragment {
    return (value && value._isFragment && value.type === "constructor");
  }
}