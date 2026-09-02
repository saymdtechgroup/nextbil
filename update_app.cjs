const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Queue and Earnings state right after allocation
const newStateStr = `
  const [userEarnings, setUserEarnings] = useState<UserEarnings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_user_earnings');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return { availableUsdt: 0, withdrawnUsdt: 0 };
  });

  const [sellQueue, setSellQueue] = useState<QueueEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nxbc_sell_queue');
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_user_earnings', JSON.stringify(userEarnings));
    }
  }, [userEarnings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nxbc_sell_queue', JSON.stringify(sellQueue));
    }
  }, [sellQueue]);
`;

code = code.replace(
  /const \[allocation, setAllocation\] = useState<AllocationState>\(\(\) => \{[\s\S]*?\}\);\n/,
  match => match + '\n' + newStateStr
);

fs.writeFileSync('src/App.tsx', code);
console.log('Done modifying state');
