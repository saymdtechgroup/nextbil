import { ethers } from "ethers";
const privKey = process.env.PAYOUT_HOT_WALLET_PRIVATE_KEY || process.env.SAFEPAL_PRIVATE_KEY;
if (privKey) {
  const wallet = new ethers.Wallet(privKey);
  console.log("Wallet address from .env private key:", wallet.address);
} else {
  console.log("No private key found in .env");
}
