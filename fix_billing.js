const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/dashboard/BillingPage.jsx', 'utf8');

// 1. Change outer wrapper
code = code.replace(
  '<div className="flex h-screen bg-gray-50 overflow-hidden font-sans">',
  '<div className="min-h-screen bg-gray-50/50 font-sans pb-32">'
);

// 2. Change Left Column wrapper
code = code.replace(
  '<div className="flex-1 flex flex-col min-w-0">',
  '<div className="flex flex-col min-w-0">'
);

// 3. Search Bar wrapper
code = code.replace(
  '<div className="p-6 shrink-0 bg-white border-b border-gray-100 shadow-sm relative z-20">\n          <div className="relative max-w-3xl mx-auto">',
  '<div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">\n          {/* Product Search */}\n          <div className="shrink-0 relative z-20">\n            <div className="relative w-full">'
);

// 4. Cart Panel wrapper
code = code.replace(
  '<div className="flex-1 overflow-auto p-6 bg-gray-50/50">',
  '<div className="overflow-visible bg-transparent">'
);

// 5. Replace the Right Panel boundary
const rightPanelOld = `          )}
        </div>
      </div>

      {/* Right Panel - Customer & Payment */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Customer Selection */}`;

const rightPanelNew = `          )}
        </div>

        {/* LIMELIGHT CHECKOUT FORM */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden ring-4 ring-brand-500/10 mt-8 mb-12">
          <div className="p-8 md:p-10 space-y-8">
            <h2 className="text-2xl font-black text-center text-gray-900 mb-8 flex items-center justify-center gap-3">
              <Receipt className="h-6 w-6 text-brand-600" />
              Finalize Sale
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">
              {/* Customer Selection */}`;

code = code.replace(rightPanelOld, rightPanelNew);

// 6. Fix hr tags and grouping
code = code.replace('<hr className="border-gray-100" />\n\n          {/* Doctor Selection */}', '{/* Doctor Selection */}');

code = code.replace(
  '<hr className="border-gray-100" />\n\n          {/* Symptom Selection */}',
  `</div>\n\n            {/* Symptom Selection */}\n            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">`
);

code = code.replace(
  `          />\n\n          <hr className="border-gray-100" />\n\n          {/* Billing Details */}\n          <div className="space-y-4">`,
  `          />\n            </div>\n\n            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">\n              {/* Billing Details */}\n              <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">`
);

code = code.replace(
  `            </div>\n          </div>\n\n          <hr className="border-gray-100" />\n\n          {/* Payment Method */}\n          <div className="space-y-3">`,
  `            </div>\n          </div>\n\n          {/* Payment Method */}\n          <div className="space-y-3 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">`
);

code = code.replace(
  `            </div>\n          </div>\n        </div>\n\n        {/* Total & Checkout */}\n        <div className="p-6 bg-brand-900 text-white border-t border-brand-800 space-y-5">`,
  `            </div>\n          </div>\n            </div>\n          </div>\n\n        {/* Total & Checkout */}\n        <div className="p-8 md:p-12 bg-brand-900 text-white space-y-8">`
);

code = code.replace(
  `        </div>\n      </div>\n    </div>`,
  `        </div>\n      </div>\n      </div>\n    </div>`
);

fs.writeFileSync('frontend/src/pages/dashboard/BillingPage.jsx', code);
console.log('Success');
