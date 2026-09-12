const { ethers } = require("ethers");
async function main() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const bal = await provider.getBalance("0xEd15E34a26222BccB1CFBf2C3567cc1195CE0E8C");
  console.log("BNB Balance:", ethers.formatEther(bal));
}
main();
