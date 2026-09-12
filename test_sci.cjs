const { ethers } = require("ethers");
try {
  let val = Number(0.000000123).toString(); // "1.23e-7"
  console.log("val:", val);
  let parsed = ethers.parseUnits(val, 18);
  console.log("Parsed:", parsed.toString());
} catch(e) {
  console.log("Error:", e.message);
}
