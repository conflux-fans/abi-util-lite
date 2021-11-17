import { ConstructorFragment } from "./ConstructorFragment";
import { ErrorFragment } from "./ErrorFragment";
import { FunctionFragment } from "./FunctionFragment";
import { EventFragment } from "./EventFragment";
import { Fragment } from "./Fragments";
import { JsonFragment } from "../SharedInterface";
import { logger } from "../Logger";

function parseFragmentFromObject(value: Fragment | JsonFragment): Fragment {
  if (Fragment.isFragment(value)) { return value; }

  switch (value.type) {
    case "function":
      return FunctionFragment.fromObject(value);
    case "event":
      return EventFragment.fromObject(value);
    case "constructor":
      return ConstructorFragment.fromObject(value);
    case "error":
      return ErrorFragment.fromObject(value);
    case "fallback":
    case "receive":
      // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
      return null;
  }

  return logger.throwArgumentError("invalid fragment object", "value", value);
}

function parseFragmentFromString(value: string): Fragment {
  // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
  value = value.replace(/\s/g, " ");
  value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
  value = value.trim();

  if (value.split(" ")[0] === "event") {
    return EventFragment.fromString(value.substring(5).trim());
  } else if (value.split(" ")[0] === "function") {
    return FunctionFragment.fromString(value.substring(8).trim());
  } else if (value.split("(")[0].trim() === "constructor") {
    return ConstructorFragment.fromString(value.trim());
  } else if (value.split(" ")[0] === "error") {
    return ErrorFragment.fromString(value.substring(5).trim());
  }

  return logger.throwArgumentError("unsupported fragment", "value", value);
}

function parseFragment(value: string | Fragment | JsonFragment): Fragment {
    if (Fragment.isFragment(value)) { return value; }

    if (typeof (value) === "string") {
      // throw new Error("not supported")
      return parseFragmentFromString(value);
    }

    return parseFragmentFromObject(value);
}

export {
  ConstructorFragment,
  ErrorFragment,
  FunctionFragment,
  EventFragment,
  Fragment,
  JsonFragment,
  parseFragment
}