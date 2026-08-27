import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("3D PRESALE PLATFORM", "PRESALE PLATFORM")

old_desc = """              <p className="text-xs text-purple-300/80 font-mono-crypto">
                Future Sell-Through Allocation &bull; 6-Box Milestone Grid &bull; Instant Multi-Sig Withdrawal
              </p>"""

new_desc = """              <p className="text-xs text-purple-200/90 mt-1.5 max-w-2xl leading-relaxed">
                NXBC is a next-generation utility coin designed for secure, high-yield P2P trading. By participating in this exclusive presale, early adopters secure their allocation at the lowest entry prices. This provides massive growth potential, automated instant payouts via our 80/20 FIFO smart contract, and guaranteed liquidity before the official Decentralized Exchange (DEX) launch.
              </p>"""

content = content.replace(old_desc, new_desc)

with open('src/App.tsx', 'w') as f:
    f.write(content)
