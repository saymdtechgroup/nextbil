const fs = require('fs');

function removeProp(file, regex) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, '');
  fs.writeFileSync(file, content);
}

removeProp('src/components/ScreenThreeWallet.tsx', /onOpenSwapModal\?: \(\) => void;/g);
removeProp('src/components/ScreenThreeWallet.tsx', /onOpenSwapModal,/g);

removeProp('src/components/BuyTokenModal.tsx', /onOpenSwapModal\?: \(\) => void;/g);
removeProp('src/components/BuyTokenModal.tsx', /onOpenSwapModal,/g);

removeProp('src/components/ScreenOneAcquisition.tsx', /onOpenSwapModal\?: \(\) => void;/g);
removeProp('src/components/ScreenOneAcquisition.tsx', /onOpenSwapModal,/g);

