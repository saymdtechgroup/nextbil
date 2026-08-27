import sys

with open('src/components/SecretAdminPage.tsx', 'r') as f:
    content = f.read()

# Translations
content = content.replace("Jab koi user kisi ke direct referral link se token buy karta hai, to direct inviter ko kitna % reward milna chahiye", "The percentage of reward the direct inviter receives when a user buys a coin via their referral link.")
content = content.replace("Har $100 ki direct token purchase par inviter ko <strong>${((100 * localSystem.directSponsorPercent) / 100).toFixed(2)} USD</strong> instant wallet me credit hoga.", "For every $100 in direct coin purchases, the inviter is instantly credited <strong>${((100 * localSystem.directSponsorPercent) / 100).toFixed(2)} USD</strong> to their wallet.")
content = content.replace("User ko matrix ke liye koi extra payment ya entry fee nahi deni hoti aur koi cycle completion deduction nahi hai. Har token purchase par user matrix me automatically place hota hai.", "Users do not pay any extra entry fees for the matrix, and there are no cycle completion deductions. Users are placed in the matrix automatically upon any coin purchase.")
content = content.replace("Presale ko temporarily pause kar dega jisse koi naya user token buy na kar sake", "Temporarily pauses the presale so no new users can purchase coins.")

# UI text
content = content.replace("Token Price &", "Coin Price &")
content = content.replace("TOKEN PRICE &", "COIN PRICE &")
content = content.replace("Token Presale &", "Coin Presale &")
content = content.replace("Set price per token, total allocation, tokens sold, multiplier, and active live phase", "Set price per coin, total allocation, coins sold, multiplier, and active live phase")
content = content.replace("Token Rate", "Coin Rate")
content = content.replace("Price Per Token", "Price Per Coin")
content = content.replace("Tokens Sold", "Coins Sold")
content = content.replace("Reward Tokens", "Reward Coins")
content = content.replace("Token Name", "Coin Name")
content = content.replace("Token Symbol", "Coin Symbol")

with open('src/components/SecretAdminPage.tsx', 'w') as f:
    f.write(content)
