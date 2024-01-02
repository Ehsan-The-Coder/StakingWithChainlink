// return the square root of bigint
function getSqrt(bigIntN) {
     if (bigIntN < 0n) {
          throw new Error(
               "Square root of negative numbers is not supported for BigInts.",
          );
     }
     if (bigIntN === 0n || bigIntN === 1n) {
          return bigIntN;
     }
     let left = 1n;
     let right = bigIntN;

     while (left <= right) {
          const mid = (left + right) / 2n;
          const midSquared = mid * mid;
          if (midSquared === bigIntN) {
               return mid;
          } else if (midSquared < bigIntN) {
               left = mid + 1n;
          } else {
               right = mid - 1n;
          }
     }
     // If we didn't find an exact match, return the floor of the square root
     return right;
}
module.exports = { getSqrt };
