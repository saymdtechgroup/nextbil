const { ethers } = require("ethers");
async function main() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
  const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)"
  ];
  const contractAddress = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1";
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
  
  try {
      const sym = await contract.symbol();
      const dec = await contract.decimals();
      console.log("Symbol:", sym);
      console.log("Decimals:", dec);
      
      // Let's check the balance of the wallet from the screenshot (00ca04... priv key -> we can't easily derive without it, but let's derive it here!)
      const wallet = new ethers.Wallet("0x00ca04fb13375634b3328a82c5fefb840311dd998412a4cc5fc3eda3b2765206");
      console.log("Wallet address for 00ca... :", wallet.address);
      const bal = await contract.balanceOf(wallet.address);
      console.log("Balance of that wallet:", ethers.formatUnits(bal, dec));

      // What about 0x5a... address? I don't have the full address, just 0x5a...68b3
  } catch (e) {
      console.log("Error:", e);
  }
}
main();
