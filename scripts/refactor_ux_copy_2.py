import os
import re

FRONTEND_DIR = r"c:\Users\niket\Documents\Hackathon-106\Google-Code-For-Communities-\frontend\dashboard\src"

REPLACEMENTS = {
    # Buttons and calls to action
    r"Report a Problem": "Propose an Improvement",
    
    # "Existing Problem" / "infrastructure problem"
    r"Existing Problem": "Current Need",
    r"existing_problem": "existing_problem", # Protect backend enum
    r"existing problem": "current need",
    r"Existing Infrastructure Problem": "Current Infrastructure Need",
    r"infrastructure problem": "infrastructure need",
    r"civic infrastructure problem": "civic infrastructure need",
    r"Describe the Problem": "Describe the Need",
    r"When did this problem start\?": "When did this need arise?",
    r"Recurring problem": "Recurring need",
    
    # "Breakdown" and "Repair"
    r"existing breakdown": "existing service gap",
    r"breakdown": "service gap",
    r"repair": "upgrade",
    
    # Forms and specific strings
    r"Have a problem in your area\?": "Have an improvement idea for your area?",
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    for pattern, replacement in REPLACEMENTS.items():
        # skip programmatic enum key if we are replacing text
        if pattern == "existing_problem": continue
        content = re.sub(pattern, replacement, content)

    # Revert specific programmatic variables
    content = content.replace("current need", "existing_problem") if 'value="current need"' in content else content
    content = content.replace("value=\"current need\"", "value=\"existing_problem\"")
    content = content.replace("requestType === \"current need\"", "requestType === \"existing_problem\"")
    
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.html')):
            replace_in_file(os.path.join(root, file))

print("Done replacing.")
