const fs = require('fs');

const appPath = 'src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

// Add LandingPage import
if (!code.includes("import { LandingPage }")) {
  code = code.replace(
    "import { ScreenThreeWallet }",
    "import { ScreenThreeWallet } from './components/ScreenThreeWallet';\nimport { LandingPage } from './components/LandingPage';"
  );
  // Also clean up any accidental double imports if they happen
  code = code.replace("from './components/ScreenThreeWallet';\nimport { LandingPage } from './components/LandingPage';\nfrom './components/ScreenThreeWallet';", "from './components/ScreenThreeWallet';\nimport { LandingPage } from './components/LandingPage';");
}

// Add state
if (!code.includes("const [isAppLaunched, setIsAppLaunched] = useState")) {
  code = code.replace(
    "const [viewMode, setViewMode] = useState<'single' | 'triple'>",
    "const [isAppLaunched, setIsAppLaunched] = useState(false);\n  const [viewMode, setViewMode] = useState<'single' | 'triple'>"
  );
}

// Wrap return
if (!code.includes("if (!isAppLaunched)")) {
  const returnIndex = code.indexOf("return (");
  code = code.slice(0, returnIndex) + 
    "if (!isAppLaunched) {\n    return <LandingPage onLaunch={() => setIsAppLaunched(true)} />;\n  }\n\n  " + 
    code.slice(returnIndex);
}

fs.writeFileSync(appPath, code);
