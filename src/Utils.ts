"use strict";
import { logger } from "./Logger"

export function defineReadOnly<T, K extends keyof T>(object: T, name: K, value: T[K]): void {
  Object.defineProperty(object, name, {
      enumerable: true,
      value: value,
      writable: false,
  });
}

export function populate(object: any, params: any) {
  for (let key in params) { defineReadOnly(object, key, params[key]); }
}

export const _constructorGuard = {};

export type TypeCheck<T> = { -readonly [ K in keyof T ]: T[K] };

export function splitNesting(value: string): Array<any> {
  value = value.trim();

  let result = [];
  let accum = "";
  let depth = 0;
  for (let offset = 0; offset < value.length; offset++) {
      let c = value[offset];
      if (c === "," && depth === 0) {
          result.push(accum);
          accum = "";
      } else {
          accum += c;
          if (c === "(") {
              depth++;
          } else if (c === ")") {
              depth--;
              if (depth === -1) {
                  logger.throwArgumentError("unbalanced parenthesis", "value", value);
              }
          }
      }
  }
  if (accum) { result.push(accum); }

  return result;
}


