import os, glob, re

files = glob.glob('frontend/dashboard/src/components/**/*.tsx', recursive=True)
for file in files:
    try:
        with open(file, 'rb') as f:
            content = f.read()
        
        # Replace the mangled Rupee symbol (usually turned into a question mark or similar before the variable)
        content = content.replace(b'?{metrics?.budget_allocated_inr', b'\xe2\x82\xb9{metrics?.budget_allocated_inr')
        content = content.replace(b'?{districtStats.allocated', b'\xe2\x82\xb9{districtStats.allocated')
        content = content.replace(b'?{stateStats.allocated', b'\xe2\x82\xb9{stateStats.allocated')
        content = content.replace(b'?{platformStats.allocated', b'\xe2\x82\xb9{platformStats.allocated')
        
        # We also had ?0 in some files
        content = content.replace(b'?0</div>', b'\xe2\x82\xb90</div>')
        
        # Fix the pushpin emoji 📍 before DISTRICT
        content = re.sub(
            b'<span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">\r\n\\s*.*?({[a-zA-Z]+\\.toUpperCase\(\)} DISTRICT)\r\n\\s*</span>',
            b'<span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">\r\n              \xf0\x9f\x93\x8d \\1\r\n            </span>',
            content,
            flags=re.DOTALL
        )
        
        with open(file, 'wb') as f:
            f.write(content)
            
    except Exception as e:
        print(f'Error on {file}: {e}')
