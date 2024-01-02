async function isUndefined(objNeedToCheck, key1, key2) {
     if (!objNeedToCheck) {
          objNeedToCheck = {};
     }
     if (objNeedToCheck[key1] === undefined) {
          if (key2 === undefined) {
               objNeedToCheck[key1] = 0n;
          } else {
               objNeedToCheck[key1] = {};
          }
     }
     if (key2 !== undefined) {
          if (objNeedToCheck[key1][key2] === undefined) {
               objNeedToCheck[key1][key2] = 0n;
          }
     }
}

module.exports = { isUndefined };
