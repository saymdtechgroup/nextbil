const fs = require('fs');
let code = fs.readFileSync('src/components/BuyTokenModal.tsx', 'utf8');

const replacement = `
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-400 hover:text-amber-400 transition-colors p-1 bg-[#1a0f35] rounded-full z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black font-rajdhani tracking-wider text-amber-400 flex items-center justify-center gap-2">
                <Coins className="w-6 h-6" />
                ACQUIRE NXBC
              </h2>
            </div>

            {/* Amount Input */}
`;

code = code.replace(
  /\{\/\* Close Button \*\/\}[\s\S]*?\{\/\* Amount Input \*\/\}/,
  replacement
);

fs.writeFileSync('src/components/BuyTokenModal.tsx', code);
console.log('Fixed BuyTokenModal step 1');
