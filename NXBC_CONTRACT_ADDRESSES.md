# NXBC Contract Address Map

These are the addresses for the current live setup.

- **NXBC token contract:** `0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1`
- **Current live presale contract:** `0x4Bc1a2f057FF9a036b8C27a90f7C7F403dC85cae`
- **Admin / NXBC return wallet:** `0x8d1abCa8Cf0f42799b9a76254710e979bd59c261`
- **BSC USDT:** `0x55d398326f99059fF775485246999027B3197955`

## Withdrawal security

For Token Sell withdrawals, the server must verify an actual BSC ERC-20 `Transfer` event for the **NXBC token contract**, with:

- `from` = the withdrawing user's wallet
- `to` = the admin / NXBC return wallet
- amount = the exact server-calculated NXBC amount
- successful BSC receipt

Only after that verification succeeds may the real USDT payout be sent. The live presale contract address is **not** used as the NXBC token address and is **not** the return destination.

The `contracts/NXBCPresale.sol` file in this repository is a **legacy/reference contract**, not the current live presale deployment.
