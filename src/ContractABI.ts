import { FormatTypes } from "./Format";
import { Fragment, ErrorFragment, EventFragment, FunctionFragment, JsonFragment, parseFragment } from "./Fragments";
import { logger } from "./Logger"
import { defineReadOnly } from "./Utils";

/**
 * 
 * @param fragments string representation of contract abi, could either be array or string
 * @returns 
 */
export function parseABIFromString(fragments: string | ReadonlyArray<string>) {
  const c = new ContractABI(fragments)
  return JSON.parse(c.format("json") as string)
}

export class ContractABI {
  readonly fragments: ReadonlyArray<Fragment>;

  readonly errors: { [name: string]: ErrorFragment };
  readonly events: { [name: string]: EventFragment };
  readonly functions: { [name: string]: FunctionFragment };
  readonly structs: { [name: string]: any };
  constructor(fragments: string | ReadonlyArray<Fragment | JsonFragment | string>) {
    logger.checkNew(new.target, ContractABI);

    let abi: ReadonlyArray<Fragment | JsonFragment | string> = [];
    if (typeof (fragments) === "string") {
      abi = JSON.parse(fragments);
    } else {
      abi = fragments;
    }

    defineReadOnly(this, "fragments", abi.map((fragment) => {
      return parseFragment(fragment);
    }).filter((fragment) => (fragment != null)));

    defineReadOnly(this, "functions", {});
    defineReadOnly(this, "errors", {});
    defineReadOnly(this, "events", {});
    defineReadOnly(this, "structs", {});

    // Add all fragments by their signature
    this.fragments.forEach((fragment) => {
      let bucket: { [name: string]: Fragment } = null;
      switch (fragment.type) {
        case "constructor":
          // if (this.deploy) {
          //   logger.warn("duplicate definition - constructor");
          //   return;
          // }
          //checkNames(fragment, "input", fragment.inputs);
          // defineReadOnly(this, "deploy", <ConstructorFragment>fragment);
          return;
        case "function":
          //checkNames(fragment, "input", fragment.inputs);
          //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
          bucket = this.functions;
          break;
        case "event":
          //checkNames(fragment, "input", fragment.inputs);
          bucket = this.events;
          break;
        case "error":
          bucket = this.errors;
          break;
        default:
          return;
      }

      let signature = fragment.format();
      if (bucket[signature]) {
        logger.warn("duplicate definition - " + signature);
        return;
      }

      bucket[signature] = fragment;
    });

    // If we do not have a constructor add a default
    // if (!this.deploy) {
    //   defineReadOnly(this, "deploy", ConstructorFragment.from({
    //     payable: false,
    //     type: "constructor"
    //   }));
    // }

    // defineReadOnly(this, "_isInterface", true);
  }

  format(format?: string): string | Array<string> {
    if (!format) { format = FormatTypes.full; }
    if (format === FormatTypes.sighash) {
      logger.throwArgumentError("interface does not support formatting sighash", "format", format);
    }

    const abi = this.fragments.map((fragment) => fragment.format(format));

    // We need to re-bundle the JSON fragments a bit
    if (format === FormatTypes.json) {
      return JSON.stringify(abi.map((j) => JSON.parse(j)));
    }

    return abi;
  }
}