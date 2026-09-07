const fs = require('fs');

// TeamPlanModal.tsx
let tpm = fs.readFileSync('src/components/TeamPlanModal.tsx', 'utf8');
tpm = tpm.replace(/NXBC-COMMUNITY-8891/g, 'NXBC-COMMUNITY-0000');
fs.writeFileSync('src/components/TeamPlanModal.tsx', tpm);

// ScreenTeam.tsx
let st = fs.readFileSync('src/components/ScreenTeam.tsx', 'utf8');
st = st.replace(/NXBC-COMMUNITY-8891/g, 'NXBC-COMMUNITY-0000');
// Also remove demo team stats if they exist in ScreenTeam
st = st.replace(/148/g, '0');
st = st.replace(/24/g, '0');
st = st.replace(/124/g, '0');
st = st.replace(/\$12,450/g, '$0.00');
st = st.replace(/\$8,450/g, '$0.00');
st = st.replace(/\$4,000/g, '$0.00');

fs.writeFileSync('src/components/ScreenTeam.tsx', st);

