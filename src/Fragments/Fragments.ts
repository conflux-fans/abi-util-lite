"use strict";

import { ParamType, parseParams } from "../ParamType"
import { logger, Logger } from "../Logger"
import { verifyState } from "../Checkers";
import { JsonFragmentType, JsonFragment } from "../SharedInterface";
import { defineReadOnly, populate, _constructorGuard, TypeCheck } from "../Utils";
import { EventFragment } from "./EventFragment";
import { FunctionFragment } from "./FunctionFragment";
import { ErrorFragment } from "./ErrorFragment";
import { ConstructorFragment } from "./ConstructorFragment";

export const regexParen = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");

export interface _Fragment {
  readonly type: string;
  readonly name: string;
  readonly inputs: ReadonlyArray<ParamType>;
}

export abstract class Fragment {
  readonly type?: string;
  readonly name?: string;
  readonly inputs?: Array<ParamType>;
  readonly _isFragment?: boolean;

  constructor(constructorGuard: any, params: any) {
    if (constructorGuard !== _constructorGuard) {
      logger.throwError("use a static from method", Logger.errors.UNSUPPORTED_OPERATION, {
        operation: "new Fragment()"
      });
    }
    populate(this, params);

    this._isFragment = true;

    Object.freeze(this);
  }

  abstract format(format?: string): string;

  static isFragment(value: any): value is Fragment {
    return !!(value && value._isFragment);
  }
}

export function parseModifiers(value: string, params: any): void {
  params.constant = false;
  params.payable = false;
  params.stateMutability = "nonpayable";

  value.split(" ").forEach((modifier) => {
    switch (modifier.trim()) {
      case "constant":
        params.constant = true;
        break;
      case "payable":
        params.payable = true;
        params.stateMutability = "payable";
        break;
      case "nonpayable":
        params.payable = false;
        params.stateMutability = "nonpayable";
        break;
      case "pure":
        params.constant = true;
        params.stateMutability = "pure";
        break;
      case "view":
        params.constant = true;
        params.stateMutability = "view";
        break;
      case "external":
      case "public":
      case "":
        break;
      default:
        console.log("unknown modifier: " + modifier);
    }
  });
}
