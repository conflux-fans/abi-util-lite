import { logger, Logger } from "../Logger"
import { ParamType, parseParams } from "../ParamType"
import { Fragment, _Fragment, parseModifiers, regexParen } from "./Fragments"
import { JsonFragmentType, JsonFragment } from "../SharedInterface";
import { verifyState, verifyIdentifier } from "../Checkers";
import { defineReadOnly, populate, _constructorGuard, TypeCheck } from "../Utils";
import { FormatTypes } from "../Format";


export class ErrorFragment extends Fragment {


  format(format?: string): string {
    if (!format) { format = FormatTypes.sighash; }
    if (!FormatTypes[format]) {
      logger.throwArgumentError("invalid format type", "format", format);
    }

    if (format === FormatTypes.json) {
      return JSON.stringify({
        type: "error",
        name: this.name,
        inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
      });
    }

    let result = "";

    if (format !== FormatTypes.sighash) {
      result += "error ";
    }

    result += this.name + "(" + this.inputs.map(
      (input) => input.format(format)
    ).join((format === FormatTypes.full) ? ", " : ",") + ") ";

    return result.trim();
  }

  static from(value: ErrorFragment | JsonFragment | string): ErrorFragment {
    if (typeof (value) === "string") {
      return ErrorFragment.fromString(value);
    }
    return ErrorFragment.fromObject(value);
  }

  static fromObject(value: ErrorFragment | JsonFragment): ErrorFragment {
    if (ErrorFragment.isErrorFragment(value)) { return value; }

    if (value.type !== "error") {
      logger.throwArgumentError("invalid error object", "value", value);
    }

    const params: TypeCheck<_Fragment> = {
      type: value.type,
      name: verifyIdentifier(value.name),
      inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : [])
    };

    return new ErrorFragment(_constructorGuard, params);
  }

  static fromString(value: string): ErrorFragment {
    let params: any = { type: "error" };

    let parens = value.match(regexParen);
    if (!parens) {
      logger.throwArgumentError("invalid error signature", "value", value);
    }

    params.name = parens[1].trim();
    if (params.name) { verifyIdentifier(params.name); }

    params.inputs = parseParams(parens[2], false);

    return ErrorFragment.fromObject(params);
  }

  static isErrorFragment(value: any): value is ErrorFragment {
    return (value && value._isFragment && value.type === "error");
  }
}
