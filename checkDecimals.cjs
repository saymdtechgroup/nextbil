const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
const nxbcAddress = "0x3F9d8f0b233A7764b567342Bc90c2a1Ac0961ff7";

const erc20Abi = ["function decimals() external view returns (uint8)"];

async function main() {
  const token = new ethers.Contract(nxbcAddress, erc20Abi, provider);
  const decimals = await token.decimals();
  console.log(`NXBC Decimals: ${decimals}`);
}
main().catch(console.error);
