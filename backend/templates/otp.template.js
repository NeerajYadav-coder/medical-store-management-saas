/**
 * templates/otp.template.js
 *
 * Responsibility:
 * - Generate professional HTML email content for OTP verification
 * - Keeps all presentation logic isolated from business logic
 */

/**
 * generateOtpEmail(otp)
 *
 * Returns a complete HTML string for an OTP verification email.
 *
 * @param {string|number} otp - The one-time password to embed in the email
 * @returns {string} Full HTML email body
 */
export const generateOtpEmail = (otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Code – Mad Store</title>
  <style>
    /* Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f4f6fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }

    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.08);
      border: 1px solid #eef2f6;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      padding: 36px 40px;
      text-align: center;
    }
    .header .brand {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header .brand span {
      color: #a5b4fc;
    }
    .header .tagline {
      font-size: 12px;
      color: #c7d2fe;
      margin-top: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Body */
    .body {
      padding: 40px 40px 32px;
      text-align: left;
    }
    .body .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }
    .body .intro {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    /* OTP Container */
    .otp-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .otp-box {
      display: inline-block;
      background: #f5f3ff;
      border: 2px dashed #6366f1;
      border-radius: 12px;
      padding: 24px 44px;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .otp-code {
      font-size: 40px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: 8px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }

    /* Validity notice */
    .validity {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 32px;
      text-align: center;
    }
    .validity strong {
      color: #dc2626;
      font-weight: 600;
    }

    /* Security list */
    .security-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
      border: 1px solid #f3f4f6;
    }
    .security-title {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .security-list {
      list-style-type: none;
      padding-left: 0;
    }
    .security-list li {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 8px;
      position: relative;
      padding-left: 18px;
    }
    .security-list li::before {
      content: "•";
      color: #6366f1;
      font-weight: bold;
      font-size: 16px;
      position: absolute;
      left: 0;
      top: -2px;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #f3f4f6;
      margin-bottom: 24px;
    }

    /* Signature */
    .signature {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      background: #f9fafb;
      border-top: 1px solid #eef2f6;
      padding: 24px 40px;
      text-align: center;
    }
    .footer .name {
      font-size: 14px;
      font-weight: 700;
      color: #4f46e5;
    }
    .footer .tag {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }
    .footer .tag strong {
      color: #4b5563;
      font-weight: 600;
    }
    .footer .sub {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header / Brand -->
    <div class="header">
      <div class="brand">⚡ Mad <span>Store</span></div>
      <div class="tagline">Empowering Modern Pharmacies</div>
    </div>

    <!-- Email Body -->
    <div class="body">
      <p class="greeting">Hello,</p>
      <p class="intro">
        Welcome to <strong>Mad Store</strong>!<br/><br/>
        Use the verification code below to verify your email address and continue with your account.
      </p>

      <!-- OTP Display -->
      <div class="otp-container">
        <div class="otp-box">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">${otp}</div>
        </div>
      </div>

      <!-- Validity -->
      <p class="validity">
        This code is valid for <strong>10 minutes</strong>.
      </p>

      <!-- Security Section -->
      <div class="security-section">
        <div class="security-title">For your security:</div>
        <ul class="security-list">
          <li>Never share this code with anyone.</li>
          <li>The Mad Store team will never ask you for this code.</li>
          <li>If you didn't request this verification, you can safely ignore this email.</li>
        </ul>
      </div>

      <hr class="divider" />

      <!-- Signature -->
      <div class="signature">
        Thank you for choosing <strong>Mad Store</strong>.<br/><br/>
        <strong>Mad Store Team</strong>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="name">Mad Store</div>
      <div class="tag">Crafted by <a href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none;"><strong>Krishna Pharmacy</strong></a></div>
      <div class="sub">© ${new Date().getFullYear()} Mad Store. All rights reserved.</div>
    </div>

  </div>
</body>
</html>
  `.trim();
};
