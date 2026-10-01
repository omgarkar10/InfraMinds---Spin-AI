import os
import re

file = 'frontend/dashboard/src/components/PolicyDashboard.tsx'
with open(file, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace any sequence of 3 or more weird characters before {metrics
content = re.sub(r'>[^<a-zA-Z0-9\s]*\{metrics', '>{metrics', content)
# Wait, we want to replace it with ?
content = re.sub(r'>[^\s<a-zA-Z0-9]*\{metrics\?\.budget_allocated_inr', '>?{metrics?.budget_allocated_inr', content)

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed budget')
