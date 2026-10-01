const fs = require('fs');
const path = require('path');

const files = [
    'frontend/dashboard/src/components/PolicyDashboard.tsx',
    'frontend/dashboard/src/components/admin/DistrictAdminDashboard.tsx',
    'frontend/dashboard/src/components/admin/PlatformAdminDashboard.tsx',
    'frontend/dashboard/src/components/admin/StateAdminDashboard.tsx',
    'frontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx',
    'frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx',
    'frontend/dashboard/src/services/adminService.ts',
    'frontend/dashboard/src/services/demandService.ts'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Common UTF-8 -> Windows-1252 mojibake
    content = content.replace(/₹/g, '?');
    content = content.replace(/⬆/g, '?');
    content = content.replace(/✓/g, '?');
    content = content.replace(/??/g, '??'); 
    content = content.replace(/� �/g, '??');
    content = content.replace(/🚀/g, '??');
    content = content.replace(/⌛/g, '?');
    content = content.replace(/✅/g, '?');
    content = content.replace(/🔒/g, '??');
    
    // Sometimes 'A?sA1' is how Powershell read the bytes 
    // We will do a generic fallback for ruppe symbol in the codebase
    content = content.replace(/A\?sA1/g, '?');
    content = content.replace(/AA\?/g, '?');
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed mojibake');
