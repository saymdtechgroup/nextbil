const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove NXBUSD_CONTRACT import
code = code.replace(/NXBUSD_CONTRACT,\s*/g, '');

// Remove NXBUSD balances
code = code.replace(/const \[nxbusdBalance, setNxbusdBalance\] = useState<number>\(0\);/g, '');
code = code.replace(/setNxbusdBalance\(0\);/g, '');
code = code.replace(/if \(!walletConnected\) \{[\s\S]*?setNxbusdBalance\(0\);[\s\S]*?\}/g, 'if (!walletConnected) { setUsdtBalance(0); setNxbcBalance(0); }');
code = code.replace(/const storedNxbusd = localStorage\.getItem\('nxbc_nxbusd_balance'\);\s*if \(storedNxbusd\) setNxbusdBalance\(Number\(storedNxbusd\)\);/g, '');

// Remove NXBUSD fetch
code = code.replace(/const \[nxbcBal, nxbusdBal, usdtBal\] = await Promise\.all\(\[[\s\S]*?\]\);/g, "const [nxbcBal, usdtBal] = await Promise.all([\n          fetchOnChainTokenBalance(NXBC_CONTRACT, walletAddress),\n          fetchOnChainTokenBalance(USDT_CONTRACT, walletAddress)\n        ]);");
code = code.replace(/setNxbusdBalance\(\(prev\) => Math.max\(prev, nxbusdBal\)\);/g, '');

// Remove Swap handlers and state
code = code.replace(/const \[isSwapModalOpen, setIsSwapModalOpen\] = useState\(false\);/g, '');
code = code.replace(/const handleSwapSuccess[\s\S]*?\} else \{[\s\S]*?\}[\s\S]*?\};\n/g, '');
code = code.replace(/onOpenSwapModal=\{[^}]*\}/g, '');
code = code.replace(/\{isSwapModalOpen && \([\s\S]*?SwapModal[\s\S]*?\}\)/g, '');

fs.writeFileSync('src/App.tsx', code);
