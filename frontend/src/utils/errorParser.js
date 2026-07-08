/**
 * utils/errorParser.js
 * 
 * Centralized utility to map technical or raw backend errors into
 * friendly, non-technical messages for end users.
 */

export const getFriendlyErrorMessage = (error) => {
  if (!error) return ''

  // If it's already a string, process it. Otherwise extract message
  const errorMsg = typeof error === 'string' 
    ? error 
    : error.message || error.response?.data?.message || ''

  const lowerMsg = errorMsg.toLowerCase()

  // 1. Rate Limiting / Too Many Attempts
  if (
    lowerMsg.includes('too many requests') || 
    lowerMsg.includes('rate limit') || 
    lowerMsg.includes('too many attempts') || 
    error.status === 429 ||
    error.response?.status === 429
  ) {
    return 'Too many attempts detected. Please wait a few minutes before trying again.'
  }

  // 2. Network failures & connection issues
  if (
    lowerMsg.includes('network error') || 
    lowerMsg.includes('unable to connect') || 
    lowerMsg.includes('timeout') || 
    lowerMsg.includes('econndrefused') ||
    lowerMsg.includes('axioserror') ||
    error.code === 'ERR_NETWORK' ||
    error.message === 'Network Error'
  ) {
    return 'Unable to connect. Please check your internet connection and try again.'
  }

  // 3. Database / 5xx Server Errors
  if (
    lowerMsg.includes('500') || 
    lowerMsg.includes('internal server error') || 
    lowerMsg.includes('database error') || 
    lowerMsg.includes('stack trace') || 
    lowerMsg.includes('exception') ||
    lowerMsg.includes('mongo') ||
    lowerMsg.includes('validation exception') ||
    (error.status && error.status >= 500) ||
    (error.response?.status && error.response.status >= 500)
  ) {
    return 'Something went wrong on our end. Please try again in a moment.'
  }

  // 4. Session Expiration / Unauthorized
  if (
    lowerMsg.includes('unauthorized') || 
    lowerMsg.includes('session expired') || 
    lowerMsg.includes('token expired') || 
    lowerMsg.includes('jwt expired') ||
    error.status === 401 ||
    error.response?.status === 401
  ) {
    return 'Your session has expired. Please sign in again.'
  }

  // 5. Authentication / Credentials
  if (
    lowerMsg.includes('invalid credentials') || 
    lowerMsg.includes('incorrect password') || 
    lowerMsg.includes('invalid password') || 
    lowerMsg.includes('user not found') ||
    lowerMsg.includes('incorrect email or password') ||
    lowerMsg.includes('invalid email or password')
  ) {
    return 'The email or password you entered is incorrect.'
  }

  // 6. Duplicate/Existing Email
  if (
    lowerMsg.includes('email already registered') || 
    lowerMsg.includes('email already exists') || 
    lowerMsg.includes('email is already in use') ||
    (lowerMsg.includes('duplicate key') && lowerMsg.includes('email'))
  ) {
    return 'This email is already registered. Please use a different email address.'
  }

  // 7. Duplicate/Existing Phone
  if (
    lowerMsg.includes('phone number already registered') || 
    lowerMsg.includes('phone already exists') || 
    lowerMsg.includes('phone is already in use') ||
    (lowerMsg.includes('duplicate key') && lowerMsg.includes('phone'))
  ) {
    return 'This phone number is already registered. Please use a different phone number.'
  }

  // 8. OTP Expirations
  if (
    lowerMsg.includes('otp expired') || 
    lowerMsg.includes('verification code has expired')
  ) {
    return 'Your verification code has expired. Request a new one to continue.'
  }

  // 9. Invalid OTP
  if (
    lowerMsg.includes('invalid otp') || 
    lowerMsg.includes('incorrect otp') || 
    lowerMsg.includes('otp is incorrect') ||
    lowerMsg.includes('verification code you entered is incorrect')
  ) {
    return 'The verification code you entered is incorrect. Please try again.'
  }

  // 10. Clean up raw Axios/Status messages
  if (lowerMsg.includes('failed with status code')) {
    return 'Something went wrong on our end. Please try again in a moment.'
  }

  // Fallback to the message if it's user-friendly, otherwise generic failure message
  return errorMsg || 'Something went wrong on our end. Please try again in a moment.'
}
