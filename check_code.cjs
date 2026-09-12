const { ethers } = require("ethers");
async function main() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const code = await provider.getCode("0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1");
  console.log("Code length:", code.length);
}
main();
