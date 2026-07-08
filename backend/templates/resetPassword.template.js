/**
 * templates/resetPassword.template.js
 *
 * Responsibility:
 * - Generate professional HTML email content for Password Reset
 */

export const generateResetPasswordEmail = (resetUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password – Krishna Pharmacy</title>
  <style>
    /* Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; }

    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #1a6b3c 0%, #27a85f 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header .brand {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .header .brand span {
      color: #a8f0c6;
    }
    .header .tagline {
      font-size: 12px;
      color: #c6f0dc;
      margin-top: 4px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Body */
    .body {
      padding: 40px 40px 32px;
      text-align: center;
    }
    .body .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 8px;
    }
    .body .instruction {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    /* Button */
    .btn-container {
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      background-color: #27a85f;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(39, 168, 95, 0.2);
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #1a6b3c;
    }

    /* Link text */
    .fallback-text {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 16px;
      word-break: break-all;
    }

    /* Validity notice */
    .validity {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 24px;
    }
    .validity strong {
      color: #e53e3e;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #f3f4f6;
      margin: 0 40px 24px;
    }

    /* Warning */
    .warning {
      font-size: 12px;
      color: #9ca3af;
      padding: 0 40px 32px;
      text-align: center;
      line-height: 1.6;
    }
    .warning strong { color: #6b7280; }

    /* Footer */
    .footer {
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      padding: 20px 40px;
      text-align: center;
    }
    .footer .name {
      font-size: 13px;
      font-weight: 700;
      color: #1a6b3c;
    }
    .footer .sub {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header / Brand -->
    <div class="header">
      <div class="brand">🌿 Krishna <span>Pharmacy</span></div>
      <div class="tagline">Trusted Healthcare Partner</div>
    </div>

    <!-- Email Body -->
    <div class="body">
      <p class="greeting">Reset Your Password</p>
      <p class="instruction">
        You requested a password reset for your Krishna Pharmacy account.<br/>
        Click the button below to choose a new password.
      </p>

      <!-- Button -->
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>

      <!-- Validity -->
      <p class="validity">
        This link is valid for <strong>10 minutes</strong> only.
      </p>

      <p class="fallback-text">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        ${resetUrl}
      </p>
    </div>

    <hr class="divider" />

    <!-- Security Warning -->
    <p class="warning">
      <strong>Didn't request this?</strong><br/>
      If you did not request a password reset, you can safely ignore this email.
      Your password will remain unchanged and your account secure.
    </p>

    <!-- Footer -->
    <div class="footer">
      <div class="name">MedStore</div>
      <div class="tag" style="font-size: 12px; color: #9ca3af; margin-top: 4px;">An initiative by <a href="https://neerajyadav-coder.github.io/krishna-pharmacy/about.html" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none;"><strong>Krishna Pharmacy</strong></a></div>
      <div class="sub">© ${new Date().getFullYear()} MedStore. All rights reserved</div>
    </div>

  </div>
</body>
</html>
  `.trim();
};
