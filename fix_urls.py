import os, re

files = [
    r'frontend\src\pages\GetInTouch.jsx',
    r'frontend\src\pages\admin\Login.jsx',
    r'frontend\src\pages\admin\EnquiryList.jsx',
    r'frontend\src\pages\admin\EnquiryDetail.jsx',
    r'frontend\src\pages\admin\Dashboard.jsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace "\1" with the template literal `${import.meta.env.VITE_API_BASE_URL}`
    # Wait, the python regex replaced the WHOLE string 'http://localhost.../path' with \1 
    # Let's see Dashboard.jsx:
    # `const response = await fetch(\1, {`
    # And there was also line 82: `const response = await fetch(`http://localhost:8000/api/v1/enquiries/${id}`, {`
    # The previous regex `r'\'http://localhost:8000/api/v1([^\']*)\''` only matched SINGLE quoted strings.
    
    # So I need to replace `\1` with `${import.meta.env.VITE_API_BASE_URL}/something` ? No, wait. 
    # The `\1` is LITERALLY the string `\1`.
    
    # Let me restore the original first by reading it from git if it's there. 
    # But wait, there is no git repo!
