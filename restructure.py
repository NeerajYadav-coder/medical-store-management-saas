import re

with open('frontend/src/pages/dashboard/Purchase.jsx', 'r') as f:
    code = f.read()

# We want to extract the three main blocks:
# 1. SEARCH & ENTRY GRID
# 2. ITEMS LIST (table)
# 3. INVOICE INFO
# 4. BILL SUMMARY

# Regexes
search_entry_match = re.search(r'({\s*/\*\s*SEARCH & ENTRY GRID\s*\*/\s*<div.*?)(?={\s*/\*\s*ITEMS LIST\s*\*/)', code, re.DOTALL)
search_entry = search_entry_match.group(1) if search_entry_match else ""

items_list_match = re.search(r'({\s*/\*\s*ITEMS LIST\s*\*/\s*<div.*?)(?=</div>\s*</div>\s*</div>\s*{\s*/\*\s*RIGHT SIDEBAR)', code, re.DOTALL)
items_list = items_list_match.group(1) if items_list_match else ""

invoice_info_match = re.search(r'({\s*/\*\s*INVOICE INFO\s*\*/\s*<div.*?)(?={\s*/\*\s*BILL SUMMARY\s*\*/)', code, re.DOTALL)
invoice_info = invoice_info_match.group(1) if invoice_info_match else ""

bill_summary_match = re.search(r'({\s*/\*\s*BILL SUMMARY\s*\*/\s*<div.*?)(?=</div>\s*</div>\s*</div>\s*\)\s*:\s*\()', code, re.DOTALL)
bill_summary = bill_summary_match.group(1) if bill_summary_match else ""

print("Found blocks:")
print("Search Entry length:", len(search_entry))
print("Items List length:", len(items_list))
print("Invoice Info length:", len(invoice_info))
print("Bill Summary length:", len(bill_summary))

# Replace the whole entry tab layout
if all([search_entry, items_list, invoice_info, bill_summary]):
    
    new_layout = f"""{{activeTab === 'entry' ? (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
          
          {invoice_info.strip()}

          <div className="relative">
             <div className="absolute inset-0 bg-brand-500/5 blur-3xl rounded-full" />
             {search_entry.replace('bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden', 'bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden relative ring-4 ring-white')}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2">
                {items_list.strip()}
             </div>
             <div className="lg:col-span-1">
                {bill_summary.strip()}
             </div>
          </div>

        </div>
      ) : ("""
      
    # Do replacement
    old_layout_pattern = r"{activeTab === 'entry' \? \(\s*<div className=\"grid grid-cols-1 xl:grid-cols-3 gap-6 items-start\">.*?(?=\)\s*:\s*\(\s*/\*\s*---\s*HISTORY VIEW)"
    
    new_code = re.sub(old_layout_pattern, new_layout.replace('\\', '\\\\'), code, flags=re.DOTALL)
    
    with open('frontend/src/pages/dashboard/Purchase.jsx', 'w') as f:
        f.write(new_code)
    print("Successfully restructured!")
else:
    print("Could not find all blocks.")

