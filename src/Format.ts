export const FormatTypes: { [ name: string ]: string } = Object.freeze({
  // Bare formatting, as is needed for computing a sighash of an event or function
  sighash: "sighash",

  // Human-Readable with Minimal spacing and without names (compact human-readable)
  minimal: "minimal",

  // Human-Readable with nice spacing, including all names
  full: "full",

  // JSON-format a la Solidity
  json: "json"
});