const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");

const presaleAddress = "0x85363386808d1f26BF3805Bb44a093a2Af9E8783";

async function main() {
  const currentBlock = await provider.getBlockNumber();
  console.log("Current block:", currentBlock);
  // Presale contract was just deployed today, so check last 1000 blocks
  const logs = await provider.getLogs({
    address: "0x55d398326f99059fF775485246999027B3197955", // USDT
    topics: [
      ethers.id("Approval(address,address,uint256)"),
      ethers.zeroPadValue("0x8d1abCa8Cf0f42799b9a76254710e979bd59c261", 32),
      ethers.zeroPadValue(presaleAddress, 32)
    ],
    fromBlock: currentBlock - 5000,
    toBlock: "latest"
  });
  console.log("Approvals to new contract:", logs.length);
}
main().catch(console.error);
