const { ethers } = require("ethers");
try {
  let val = Number(33.333333333333336).toString();
  console.log("val:", val);
  let parsed = ethers.parseUnits(val, 18);
  console.log("Parsed:", parsed.toString());
} catch (e) {
  console.log("Error:", e.message);
}

try {
  let val2 = (1 / 3).toString();
  console.log("val2:", val2);
  let parsed2 = ethers.parseUnits(val2, 18);
  console.log("Parsed2:", parsed2.toString());
} catch(e) {
  console.log("Error2:", e.message);
}
