import re
import os

filepath = 'frontend/src/pages/billing/BillingPage.jsx'
with open(filepath, 'r') as f:
    code = f.read()

# 1. Search Bar Block
search_match = re.search(r'({\s*/\*\s*Product Search\s*\*/.*?)(?={\s*/\*\s*Cart Panel\s*\*/)', code, re.DOTALL)
search_block = search_match.group(1).strip() if search_match else ""

# 2. Cart Panel Block
cart_match = re.search(r'({\s*/\*\s*Cart Panel\s*\*/.*?)(?={\s*/\*\s*LIMELIGHT CHECKOUT FORM\s*\*/)', code, re.DOTALL)
cart_block = cart_match.group(1).strip() if cart_match else ""

# 3. Checkout Form Block
checkout_match = re.search(r'({\s*/\*\s*LIMELIGHT CHECKOUT FORM\s*\*/.*?)(?=\s*</div>\s*</div>\s*</div>\s*</div>\s*\)\s*;)', code, re.DOTALL)
checkout_block = checkout_match.group(1).strip() if checkout_match else ""

if not all([search_block, cart_block, checkout_block]):
    print("Could not extract blocks!")
    print(f"Search: {bool(search_block)}")
    print(f"Cart: {bool(cart_block)}")
    print(f"Checkout: {bool(checkout_block)}")
    exit(1)

# Now rebuild the layout
new_layout = f"""
        <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Left Column: Search & Cart */}
            <div className="xl:col-span-7 2xl:col-span-8 flex flex-col gap-6">
              {search_block}
              
              <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                {cart_block.replace('<div className="overflow-visible bg-transparent">', '<div className="h-full">')}
              </div>
            </div>

            {/* Right Column: Checkout Form */}
            <div className="xl:col-span-5 2xl:col-span-4">
              <div className="sticky top-6">
                {checkout_block.replace('mt-8 mb-12', '').replace('bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden ring-4 ring-brand-500/10', 'bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden ring-4 ring-brand-500/10 flex flex-col max-h-[calc(100vh-8rem)]')}
              </div>
            </div>
            
          </div>
        </div>
"""

# Replace in code
# Find where the old layout starts
start_pattern = r'<div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">.*?LIMELIGHT CHECKOUT FORM.*?</div>\s*</div>\s*</div>\s*</div>\s*\)\s*;'

new_full_code = re.sub(start_pattern, new_layout.replace('\\', '\\\\') + '\n      </div>\n    </div>\n  );', code, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(new_full_code)
    
print("Successfully rewritten BillingPage.jsx")
