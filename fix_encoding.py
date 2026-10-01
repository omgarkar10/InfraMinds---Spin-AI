import os
import re

files = [
    'frontend/dashboard/src/components/PolicyDashboard.tsx',
    'frontend/dashboard/src/components/admin/DistrictAdminDashboard.tsx',
    'frontend/dashboard/src/components/admin/PlatformAdminDashboard.tsx',
    'frontend/dashboard/src/components/admin/StateAdminDashboard.tsx',
    'frontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx',
    'frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx',
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Replace the corrupted INR symbol
        content = re.sub(r'A\xef\xbf\xbd\?sA1', '?', content)
        content = content.replace('₹', '?')
        
        # Replace up arrow in queue
        content = re.sub(r'⬆', '?', content)
        content = re.sub(r'A\xef\xbf\xbdA\xef\xbf\xbd\?', '?', content)
        content = re.sub(r'A\xef\xbf\xbdA\xef\xbf\xbd\?', '?', content)
        
        # Replace other corrupted emojis if needed
        content = content.replace('✓', '?')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
print('Fixed encodings')
