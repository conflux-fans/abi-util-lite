/**
 * @param {*} value
 * @param {*} defaultVal
 * @returns
 */
function isDefault(value, defaultVal) {
  if (value === undefined || value === null || value === defaultVal) {
    return true;
  }
  return false;
}

function matchObjectWithDefault(x, y, default_ = {}, required=[]) {
  // there could be abundant field in x
  let field
  if (required.length !== 0) {
    field = required
  } else {
    field = Object.keys(y).concat(Object.keys(default_))
  }
  for (const key of field) {
    // 2 situation will pass the check, both are default
    // or equal
    if (
      (isDefault(x[key], default_[key]) && isDefault(y[key], default_[key])) ||
      x[key] === y[key]
    ) {
      continue;
    } else {
      return {
        pass: false,
        message: `Attribute '${key}' not match. Receives ${x[key]} and ${y[key]} (with default ${default_[key]})`,
      };
    }
  }
  return {
    pass: true,
    message: "hello",
  };
}

function matchOrderedArray(xarray, yarray, itemDefault = {}, itemRequired=[]) {
  if (xarray.length !== yarray.length) {
    return {
      pass: false,
      message: `Length not match. Receives ${xarray.length} and ${yarray.length}`,
    };
  }
  for (let i = 0; i < xarray.length; i += 1) {
    const result = matchObjectWithDefault(
      xarray[i],
      yarray[i],
      itemDefault,
      itemRequired
    );
    if (!result.pass) {
      // const message = result.message(xarray[i], yarray[i], itemDefault)
      return {
        pass: false,
        message: result.message,
      };
    }
  }
  return {
    pass: true,
    message: "",
  };
}

function matchConstructorFragment(x, y) {
  let result;
  result = matchObjectWithDefault(x, y, {}, required=["type", "stateMutability"])
  if (!result.pass) {
    return result
  }
  result = matchOrderedArray(x.inputs, y.inputs, {}, ["name", "type", "components"])
  if (!result.pass) {
    return result
  }
  return {
    pass: true,
    message: "Constructor fragment matches"
  }
}

function matchFunctionFragment(x, y) {
  let result;
  result = matchObjectWithDefault(x, y, {}, required=["type", "stateMutability", "name"])
  if (!result.pass) {
    return result
  }
  result = matchOrderedArray(x.inputs, y.inputs, {}, ["name", "type", "components"])
  if (!result.pass) {
    return result
  }
  result = matchOrderedArray(x.outputs, y.outputs, {}, ["name", "type", "components"])
  if (!result.pass) {
    return result
  }
  return {
    pass: true,
    message: "function fragment matches"
  }
}

function matchEventFragment(x, y) {
  let result;
  result = matchObjectWithDefault(x, y, {}, required=["type", "name", "anonymous"])
  if (!result.pass) {
    return result
  }
  result = matchOrderedArray(x.inputs, y.inputs, {indexed: false}, ["name", "type", "components", "indexed"])
  if (!result.pass) {
    return result
  }
  return {
    pass: true,
    message: "function fragment matches"
  }
}

function matchErrorFragment(x, y) {
  let result;
  result = matchObjectWithDefault(x, y, {}, required=["type", "name"])
  if (!result.pass) {
    return result
  }
  result = matchOrderedArray(x.inputs, y.inputs, {indexed: false}, ["name", "type", "components"])
  if (!result.pass) {
    return result
  }
  return {
    pass: true,
    message: "error fragment matches"
  }
}

function matchFragment(x, y) {
  switch(x.type){
    case "constructor":
      return matchConstructorFragment(x,y)
    case "function":
      return matchFunctionFragment(x,y)
    case "event":
      return matchEventFragment(x,y)
    case "error":
      return matchErrorFragment(x,y)
    default:
      return {
        pass: false,
        message: `fragment type invalid. Expect constructor/function/error/event, receives ${x.type} for fragment name ${x.name}`
      }
  }
}

function findAbiFragmentByName(expectedAbiJson, name) {
  for (let frag of expectedAbiJson) {
    if (frag.name === name) {
      return frag;
    }
  }
}

module.exports = {
  matchOrderedArray,
  matchObjectWithDefault,
  findAbiFragmentByName,
  matchFragment
}
