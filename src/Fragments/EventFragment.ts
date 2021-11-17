import { logger, Logger } from "../Logger"
import { ParamType, parseParams } from "../ParamType"
import { Fragment, _Fragment, parseModifiers, regexParen } from "./Fragments"
import { JsonFragmentType, JsonFragment } from "../SharedInterface";
import { verifyState, verifyIdentifier } from "../Checkers";
import { defineReadOnly, populate, _constructorGuard, TypeCheck } from "../Utils";
import { FormatTypes } from "../Format";

interface _EventFragment extends _Fragment {
  readonly anonymous: boolean;
}

export class EventFragment extends Fragment {
  readonly anonymous: boolean;

  format(format?: string): string {
    if (!format) { format = FormatTypes.sighash; }
    if (!FormatTypes[format]) {
      logger.throwArgumentError("invalid format type", "format", format);
    }

    if (format === FormatTypes.json) {
      return JSON.stringify({
        type: "event",
        anonymous: this.anonymous,
        name: this.name,
        inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
      });
    }

    let result = "";

    if (format !== FormatTypes.sighash) {
      result += "event ";
    }

    result += this.name + "(" + this.inputs.map(
      (input) => input.format(format)
    ).join((format === FormatTypes.full) ? ", " : ",") + ") ";

    if (format !== FormatTypes.sighash) {
      if (this.anonymous) {
        result += "anonymous ";
      }
    }

    return result.trim();
  }

  static from(value: EventFragment | JsonFragment | string): EventFragment {
    if (typeof (value) === "string") {
      return EventFragment.fromString(value);
    }
    return EventFragment.fromObject(value);
  }

  static fromObject(value: JsonFragment | EventFragment): EventFragment {
    if (EventFragment.isEventFragment(value)) { return value; }

    if (value.type !== "event") {
      logger.throwArgumentError("invalid event object", "value", value);
    }

    const params: TypeCheck<_EventFragment> = {
      name: verifyIdentifier(value.name),
      anonymous: value.anonymous,
      inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
      type: "event"
    };

    return new EventFragment(_constructorGuard, params);
  }

  static fromString(value: string): EventFragment {

    let match = value.match(regexParen);
    if (!match) {
      logger.throwArgumentError("invalid event string", "value", value);
    }

    let anonymous = false;
    match[3].split(" ").forEach((modifier) => {
      switch (modifier.trim()) {
        case "anonymous":
          anonymous = true;
          break;
        case "":
          break;
        default:
          logger.warn("unknown modifier: " + modifier);
      }
    });

    return EventFragment.fromObject({
      name: match[1].trim(),
      anonymous: anonymous,
      inputs: parseParams(match[2], true),
      type: "event"
    });
  }

  static isEventFragment(value: any): value is EventFragment {
    return (value && value._isFragment && value.type === "event");
  }
}
