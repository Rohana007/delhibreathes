/**
 * Phone Masking Service
 * Masks phone numbers for privacy
 */

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return 'XXXXXXX000';
  }
  
  const phoneStr = String(phone);
  if (phoneStr.length < 3) {
    return 'XXXXXXX000';
  }
  
  return 'XXXXXXX' + phoneStr.slice(-3);
}

module.exports = {
  maskPhone,
};

