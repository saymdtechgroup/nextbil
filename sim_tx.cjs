const { ethers } = require("ethers");
async function main() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const ERC20_ABI = ["function transfer(address to, uint256 value) public returns (bool)"];
  const contractAddress = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1";
  const wallet = new ethers.Wallet("0x00ca04fb13375634b3328a82c5fefb840311dd998412a4cc5fc3eda3b2765206", provider);
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);
  
  try {
     const toAddress = "0x000000000000000000000000000000000000dead";
     const amount = ethers.parseUnits("1", 18);
     
     // Estimate Gas
     const estGas = await contract.transfer.estimateGas(toAddress, amount);
     console.log("Estimated Gas:", estGas.toString());
     
  } catch (e) {
     console.log("Simulation Failed:", e.reason || e.message);
  }
}
main();
