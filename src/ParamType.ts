"use strict";

import { checkModifier, verifyType } from "./Checkers";
import { logger } from "./Logger"
import { defineReadOnly, populate, _constructorGuard, splitNesting } from "./Utils";
import { JsonFragmentType, ParseState, ParseNode } from "./SharedInterface";
import { FormatTypes } from "./Format";

const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);

export function parseParams(value: string, allowIndex: boolean): Array<ParamType> {
  return splitNesting(value).map((param) => ParamType.fromString(param, allowIndex));
}

// @TODO: Make sure that children of an indexed tuple are marked with a null indexed
function parseParamType(param: string, allowIndexed: boolean): ParseNode {

  let originalParam = param;
  function throwError(i: number) {
    logger.throwArgumentError(`unexpected character at position ${i}`, "param", param);
  }
  param = param.replace(/\s/g, " ");

  function newNode(parent: ParseNode): ParseNode {
    let node: ParseNode = { type: "", name: "", parent: parent, state: { allowType: true } };
    if (allowIndexed) { node.indexed = false; }
    return node
  }

  let parent: ParseNode = { type: "", name: "", state: { allowType: true } };
  let node = parent;

  for (let i = 0; i < param.length; i++) {
    let c = param[i];
    switch (c) {
      case "(":
        if (node.state!.allowType && node.type === "") {
          node.type = "tuple";
        } else if (!node.state!.allowParams) {
          throwError(i);
        }
        node.state!.allowType = false;
        node.type = verifyType(node.type!);
        node.components = [newNode(node)];
        node = node.components[0];
        break;

      case ")":
        delete node.state;

        if (node.name === "indexed") {
          if (!allowIndexed) { throwError(i); }
          node.indexed = true;
          node.name = "";
        }

        if (checkModifier(node.type!, node.name!)) { node.name = ""; }

        node.type = verifyType(node.type!);

        let child = node;
        node = node.parent;
        if (!node) { throwError(i); }
        delete child.parent;
        node.state!.allowParams = false;
        node.state!.allowName = true;
        node.state!.allowArray = true;
        break;

      case ",":
        delete node.state;

        if (node.name === "indexed") {
          if (!allowIndexed) { throwError(i); }
          node.indexed = true;
          node.name = "";
        }

        if (checkModifier(node.type!, node.name!)) { node.name = ""; }

        node.type = verifyType(node.type!);

        let sibling: ParseNode = newNode(node.parent);
        //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
        node.parent.components.push(sibling);
        delete node.parent;
        node = sibling;
        break;

      // Hit a space...
      case " ":

        // If reading type, the type is done and may read a param or name
        if (node.state!.allowType) {
          if (node.type !== "") {
            node.type = verifyType(node.type!);
            delete node.state!.allowType;
            node.state!.allowName = true;
            node.state!.allowParams = true;
          }
        }

        // If reading name, the name is done
        if (node.state!.allowName) {
          if (node.name !== "") {
            if (node.name === "indexed") {
              if (!allowIndexed) { throwError(i); }
              if (node.indexed) { throwError(i); }
              node.indexed = true;
              node.name = "";
            } else if (checkModifier(node.type!, node.name!)) {
              node.name = "";
            } else {
              node.state!.allowName = false;
            }
          }
        }

        break;

      case "[":
        if (!node.state!.allowArray) { throwError(i); }

        node.type += c;

        node.state!.allowArray = false;
        node.state!.allowName = false;
        node.state!.readArray = true;
        break;

      case "]":
        if (!node.state!.readArray) { throwError(i); }

        node.type += c;

        node.state!.readArray = false;
        node.state!.allowArray = true;
        node.state!.allowName = true;
        break;

      default:
        if (node.state!.allowType) {
          node.type += c;
          node.state!.allowParams = true;
          node.state!.allowArray = true;
        } else if (node.state!.allowName) {
          node.name += c;
          delete node.state!.allowArray;
        } else if (node.state!.readArray) {
          node.type += c;
        } else {
          throwError(i);
        }
    }
  }

  if (node.parent) { logger.throwArgumentError("unexpected eof", "param", param); }

  delete parent.state;

  if (node.name === "indexed") {
    if (!allowIndexed) { throwError(originalParam.length - 7); }
    if (node.indexed) { throwError(originalParam.length - 7); }
    node.indexed = true;
    node.name = "";
  } else if (checkModifier(node.type!, node.name!)) {
    node.name = "";
  }

  parent.type = verifyType(parent.type!);

  return parent;
}


export class ParamType {

  // The local name of the parameter (of null if unbound)
  readonly name?: string;

  // The fully qualified type (e.g. "address", "tuple(address)", "uint256[3][]"
  readonly type?: string;

  // The base type (e.g. "address", "tuple", "array")
  readonly baseType?: string;

  // Indexable Paramters ONLY (otherwise null)
  readonly indexed: boolean;

  // Tuples ONLY: (otherwise null)
  //  - sub-components
  readonly components?: Array<ParamType>;

  // Arrays ONLY: (otherwise null)
  //  - length of the array (-1 for dynamic length)
  //  - child type
  readonly arrayLength?: number;
  readonly arrayChildren?: ParamType;

  readonly _isParamType: boolean;

  constructor(constructorGuard: any, params: any) {
    if (constructorGuard !== _constructorGuard) {
      logger.throwError("use fromString")
    }
    populate(this, params);

    let match = this.type!.match(paramTypeArray);
    if (match) {
      populate(this, {
        arrayLength: parseInt(match[2] || "-1"),
        arrayChildren: ParamType.fromObject({
          type: match[1],
          components: this.components
        }),
        baseType: "array"
      });
    } else {
      populate(this, {
        arrayLength: null,
        arrayChildren: null,
        baseType: ((this.components != null) ? "tuple" : this.type)
      });
    }

    this._isParamType = true;

    Object.freeze(this);
  }

  // Format the parameter fragment
  //   - sighash: "(uint256,address)"
  //   - minimal: "tuple(uint256,address) indexed"
  //   - full:    "tuple(uint256 foo, address bar) indexed baz"
  format(format?: string): string {
    if (!format) { format = FormatTypes.sighash; }
    if (!FormatTypes[format]) {
      logger.throwArgumentError("invalid format type", "format", format);
    }

    if (format === FormatTypes.json) {
      let result: any = {
        type: ((this.baseType === "tuple") ? "tuple" : this.type),
        name: (this.name || undefined)
      };
      if (typeof (this.indexed) === "boolean") { result.indexed = this.indexed; }
      if (this.components) {
        result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
      }
      return JSON.stringify(result);
    }

    let result = "";

    // Array
    if (this.baseType === "array") {
      result += this.arrayChildren.format(format);
      result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
    } else {
      if (this.baseType === "tuple") {
        if (format !== FormatTypes.sighash) {
          result += this.type;
        }
        result += "(" + this.components.map(
          (comp) => comp.format(format)
        ).join((format === FormatTypes.full) ? ", " : ",") + ")";
      } else {
        result += this.type;
      }
    }

    if (format !== FormatTypes.sighash) {
      if (this.indexed === true) { result += " indexed"; }
      if (format === FormatTypes.full && this.name) {
        result += " " + this.name;
      }
    }

    return result;
  }

  static fromObject(value: JsonFragmentType | ParamType): ParamType {
    if (ParamType.isParamType(value)) { return value; }

    return new ParamType(_constructorGuard, {
      name: (value.name || null),
      type: verifyType(value.type!),
      indexed: ((value.indexed == null) ? null : !!value.indexed),
      components: (value.components ? value.components.map(ParamType.fromObject) : null)
    });
  }

  static fromString(value: string, allowIndexed?: boolean): ParamType {
    function ParamTypify(node: ParseNode): ParamType {
      return ParamType.fromObject({
        name: node.name,
        type: node.type,
        indexed: node.indexed,
        components: node.components
      });
    }

    return ParamTypify(parseParamType(value, !!allowIndexed));
  }

  static isParamType(value: any): value is ParamType {
    return !!(value != null && value._isParamType);
  }
};
