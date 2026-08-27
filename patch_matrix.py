import sys

with open('src/components/MatrixPlanModal.tsx', 'r') as f:
    content = f.read()

replacements = {
    "Admin Set:": "System Set:",
    "LIVE ADMIN VARIABLES": "LIVE SYSTEM VARIABLES",
    "Admin Dynamic Placement": "System Dynamic Placement",
    "User A ne B, C, D, E, F, G ko sponsor kiya, isliye un sabhi 6 users ke package/token purchase ka <strong>Direct Sponsor % (e.g. 5%)</strong> seedhe User A ke wallet me instant credit ho gaya.": "User A sponsored B, C, D, E, F, and G. Therefore, the <strong>Direct Sponsor % (e.g. 5%)</strong> of all 6 users' coin purchases is instantly credited to User A's wallet.",
    "Level 1 Referral Income (Sabhi 6 Users Par)": "Level 1 Referral Income (On All 6 Users)",
    "Kyunki ye 6 log User A ke direct team hain, to Unilevel Referral Plan ke hisab se ye sabhi User A ke <strong>Level 1</strong> me aate hain. Isliye User A ko inka <strong>Level 1 Commission (10%)</strong> mila.": "Because these 6 users are User A's direct referrals, they all fall under User A's <strong>Level 1</strong> according to the Unilevel Referral Plan. Hence, User A receives their <strong>Level 1 Commission (10%)</strong>.",
    "A ke niche B aur C place hue:": "B and C are placed under A:",
    "<strong>User A</strong> ko B aur C ka Placement Income mila:": "<strong>User A</strong> receives the Placement Income for B and C:",
    "(kyunki wo directly A ke niche place hue).": "(since they are placed directly under A).",
    "User A ke upar ke sabhi 10 Uplines ko B aur C se 10% - 10% (${uplineAmountPerLevel.toFixed(2)} each) mila.": "All 10 Uplines above User A receive 10% (${uplineAmountPerLevel.toFixed(2)} each) from B and C.",
    "B ke niche D aur E place hue:": "D and E are placed under B:",
    "Placement Income (<strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${(basePlacementUsd * 2).toFixed(2)}</strong>) <strong>User B</strong> ko mila kyunki D aur E directly User B ke niche place hue!": "Placement Income (<strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${(basePlacementUsd * 2).toFixed(2)}</strong>) is credited to <strong>User B</strong> because D and E are placed directly under User B!",
    "<strong>User A</strong> yaha Upline Level 1 hai, isliye User A ko ${basePlacementUsd.toFixed(2)} ka <strong>10% (${uplineAmountPerLevel.toFixed(2)} from D + ${uplineAmountPerLevel.toFixed(2)} from E = ${(uplineAmountPerLevel * 2).toFixed(2)})</strong> mila!": "<strong>User A</strong> is Upline Level 1 here, so User A receives <strong>10% of ${basePlacementUsd.toFixed(2)} (${uplineAmountPerLevel.toFixed(2)} from D + ${uplineAmountPerLevel.toFixed(2)} from E = ${(uplineAmountPerLevel * 2).toFixed(2)})</strong>!",
    "User A ke upar jo bhi uplines hain, un sabhi ko pure 10 Level tak 10% - 10% (${uplineAmountPerLevel.toFixed(2)} each) mila.": "All uplines above User A receive 10% (${uplineAmountPerLevel.toFixed(2)} each) up to 10 Levels.",
    "C ke niche F aur G place hue:": "F and G are placed under C:",
    "Placement Income (<strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${(basePlacementUsd * 2).toFixed(2)}</strong>) <strong>User C</strong> ko mila kyunki F aur G directly User C ke niche place hue!": "Placement Income (<strong>${basePlacementUsd.toFixed(2)} + ${basePlacementUsd.toFixed(2)} = ${(basePlacementUsd * 2).toFixed(2)}</strong>) is credited to <strong>User C</strong> because F and G are placed directly under User C!",
    "<strong>User A</strong> ko ${basePlacementUsd.toFixed(2)} ka <strong>10% (${uplineAmountPerLevel.toFixed(2)} from F + ${uplineAmountPerLevel.toFixed(2)} from G = ${(uplineAmountPerLevel * 2).toFixed(2)})</strong> mila!": "<strong>User A</strong> receives <strong>10% of ${basePlacementUsd.toFixed(2)} (${uplineAmountPerLevel.toFixed(2)} from F + ${uplineAmountPerLevel.toFixed(2)} from G = ${(uplineAmountPerLevel * 2).toFixed(2)})</strong>!",
    "A ke upar ke sabhi 10-level uplines ko bhi 10% - 10% (${uplineAmountPerLevel.toFixed(2)} each) mila.": "All 10-level uplines above A also receive 10% (${uplineAmountPerLevel.toFixed(2)} each).",
    "User ko matrix ke liye koi alag se entry fee ya extra payment nahi deni hoti. Presale me aane wala har member automatically 2x2 tree me place ho jata hai aur system live placement income distribute karta hai.": "Users do not pay any separate entry fee or extra payment for the matrix. Every member entering the presale is automatically placed in the 2x2 tree, and the system instantly distributes live placement income."
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('src/components/MatrixPlanModal.tsx', 'w') as f:
    f.write(content)
