import sys

with open('src/components/BuyTokenModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "Aapne <strong>{tokenQuantity.toLocaleString()} NXBC</strong> enter kiya hai, jabki <strong>{activePhaseInfo.name}</strong> me sirf <strong>{maxAvailableInPhase.toLocaleString()} NXBC</strong> bache hain. Admin limit se zyada tokens purchase nahi kiye ja sakte.",
    "You entered <strong>{tokenQuantity.toLocaleString()} NXBC</strong>, but only <strong>{maxAvailableInPhase.toLocaleString()} NXBC</strong> are remaining in <strong>{activePhaseInfo.name}</strong>. You cannot purchase coins beyond the limit set by the Admin."
)
content = content.replace("how many tokens will sell", "how many coins will sell")

content = content.replace("Buy Token", "Buy Coin")
content = content.replace("Buy Tokens", "Buy Coins")
content = content.replace("Tokens To Receive", "Coins To Receive")
content = content.replace("Token Sell Schedule", "Coin Sell Schedule")
content = content.replace("Total Purchased Tokens", "Total Purchased Coins")
content = content.replace("Live Token Allocation List", "Live Coin Allocation List")
content = content.replace("Live Token Math Summary Tracker", "Live Coin Math Summary Tracker")
content = content.replace("Tokens Allocated for Sale", "Coins Allocated for Sale")
content = content.replace("Allocated tokens", "Allocated coins")
content = content.replace("exceed purchased tokens", "exceed purchased coins")

with open('src/components/BuyTokenModal.tsx', 'w') as f:
    f.write(content)
