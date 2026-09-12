const { ethers } = require("ethers");
try {
  let tokenAmount = 33.333333333333336;
  let val = Number(tokenAmount).toFixed(18); 
  console.log("val:", val);
  let parsed = ethers.parseUnits(val, 18);
  console.log("Parsed:", parsed.toString());
  
  let val2 = Number(0.000000123).toFixed(18);
  console.log("val2:", val2);
  let parsed2 = ethers.parseUnits(val2, 18);
  console.log("Parsed2:", parsed2.toString());
} catch(e) {
  console.log("Error:", e.message);
}
