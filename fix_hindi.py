import os

replacements = {
    "Maan lo <strong>User A</strong> ne 6 direct members sponsor kiye. Dekhiye kis tarah 3 transparent income streams kaam karti hain:": "Suppose <strong>User A</strong> sponsors 6 direct members. Here is how the 3 transparent income streams work:",
    "Direct Sponsor Income (Sabhi 6 Users Par)": "Direct Sponsor Income (On All 6 Users)",
    "User jiske niche place hua use seedhe": "The immediate parent receives",
    "milenge (e.g. B ko D aur E se": "(e.g., B receives",
    "each).": "each).",
    "Upar ke sabhi <strong>20 Level Uplines</strong> ko is": "All <strong>10 Level Uplines</strong> above will receive",
    "ka <strong>{uplinePercent}%": "of <strong>{uplinePercent}%",
    "milega!": "</strong>!",
    "Kya aap sach me sabhi settings ko factory default parameters par reset karna chahte hain?": "Are you sure you want to reset all settings to factory default parameters?",
    "Har $1,000 ki purchase par": "For every $1,000 purchase,",
    "credit hoga.": "will be credited.",
    "Direct sponsor bonus seedhe user ke claimable wallet balance me credit hota hai jise instant withdraw kiya ja sakta hai.": "The direct sponsor bonus is instantly credited to the user's claimable wallet balance and is available for immediate withdrawal.",
    "Har ek level ka percentage (%) aur unlock karne ke liye zaroori direct active referrals set karein": "Set the percentage (%) and the required active direct referrals to unlock each level",
    "New user jiske niche directly place hoga (Immediate Parent), use seedhe ye": "The immediate parent (under whom the new user is directly placed) will instantly receive this",
    "milenge.": "",
    "Placement income (": "From the placement income (",
    ") ka": "),",
    "upar ke sabhi 10 levels ke uplines ko har level par barabar milega.": "will be equally distributed to all 10 upline levels.",
    "Kya aap default settings restore karna chahte hain?": "Do you wish to restore default settings?",
    "Tamam System Settings live app me update ho chuki hain!": "All System Settings have been successfully updated in the live app!",
    "Dekhein ki user purchase par har income stream me kitna payout banega": "Preview the payout generated for each income stream upon a user purchase"
}

def replace_in_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 20 to 10 level replacements
    content = content.replace("20-Level", "10-Level")
    content = content.replace("20-level", "10-level")
    content = content.replace("20 Levels", "10 Levels")
    content = content.replace("20 Level Uplines", "10 Level Uplines")
    content = content.replace("20 Uplines", "10 Uplines")
    content = content.replace("20 uplines", "10 uplines")
    content = content.replace("20-Tier", "10-Tier")
    content = content.replace("20-Uplines", "10-Uplines")
    content = content.replace("20 Level", "10 Level")

    # Hindi to English replacements
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    # Manual cleanups for MatrixPlanModal
    content = content.replace("User jiske niche place hua use seedhe <strong>${basePlacementUsd.toFixed(2)}</strong> milenge (e.g. B ko D aur E se ${basePlacementUsd.toFixed(2)} each).", "The immediate parent receives exactly <strong>${basePlacementUsd.toFixed(2)}</strong> (e.g., B receives ${basePlacementUsd.toFixed(2)} each from D and E).")
    content = content.replace("Upar ke sabhi <strong>10 Level Uplines</strong> ko is ${basePlacementUsd.toFixed(2)} ka <strong>{uplinePercent}% (${uplineAmountPerLevel.toFixed(2)} each)</strong> milega!", "All <strong>10 Level Uplines</strong> above will receive <strong>{uplinePercent}% (${uplineAmountPerLevel.toFixed(2)} each)</strong> from this ${basePlacementUsd.toFixed(2)}!")
    
    # SecretAdminPage cleanups
    content = content.replace("Har $1,000 ki purchase par <strong>${((1000 * localSystem.directSponsorPercent) / 100).toFixed(2)} USD</strong> credit hoga.", "<strong>${((1000 * localSystem.directSponsorPercent) / 100).toFixed(2)} USD</strong> will be credited for every $1,000 purchase.")
    
    content = content.replace("New user jiske niche directly place hoga (Immediate Parent), use seedhe ye ${localMatrix.placementIncomeUsd ?? 1.0} USD milenge.", "The immediate parent (under whom the new user is directly placed) will instantly receive ${localMatrix.placementIncomeUsd ?? 1.0} USD.")
    
    content = content.replace("Placement income (${localMatrix.placementIncomeUsd ?? 1.0}) ka {localMatrix.uplineSharePercent ?? 10}% (${((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100).toFixed(2)}) upar ke sabhi 10 levels ke uplines ko har level par barabar milega.", "An upline share of {localMatrix.uplineSharePercent ?? 10}% (${((localMatrix.placementIncomeUsd ?? 1.0) * (localMatrix.uplineSharePercent ?? 10) / 100).toFixed(2)}) from the placement income (${localMatrix.placementIncomeUsd ?? 1.0}) will be equally distributed across all 10 upline levels.")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'src/components/MatrixPlanModal.tsx',
    'src/components/SecretAdminPage.tsx',
    'src/components/AdminPanelModal.tsx',
    'src/components/ScreenTeam.tsx',
    'src/components/ScreenOneAcquisition.tsx',
    'src/components/ScreenTwoAssets.tsx',
    'src/components/ScreenThreeWallet.tsx',
    'src/components/BuyTokenModal.tsx'
]

for file in files:
    replace_in_file(file)

