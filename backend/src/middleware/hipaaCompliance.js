const crypto = require('crypto');

/**
 * HIPAA Compliance Middleware
 * Health Insurance Portability and Accountability Act
 */

// PHI (Protected Health Information) patterns to detect
const PHI_PATTERNS = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  dob: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
  mrn: /\bMRN[:\s]*[\w-]+\b/i
};

/**
 * Detect PHI in data before logging or export
 */
function detectPHI(data) {
  const findings = [];
  
  if (typeof data === 'string') {
    for (const [type, pattern] of Object.entries(PHI_PATTERNS)) {
      if (pattern.test(data)) {
        findings.push(type);
      }
    }
  }
  
  return findings;
}

/**
 * Anonymize data for research export
 */
function anonymizeData(data, fieldsToRemove = ['ssn', 'phone', 'email', 'dob']) {
  if (Array.isArray(data)) {
    return data.map(item => anonymizeData(item, fieldsToRemove));
  }
  
  if (typeof data === 'object' && data !== null) {
    const anonymized = {};
    for (const [key, value] of Object.entries(data)) {
      // Generate anonymous ID
      if (key.match(/^(id|userId|patientId|chwId)$/i)) {
        anonymized[key] = generateAnonymousId(value);
      } else if (key.match(/^(name|fullName|firstName|lastName)$/i)) {
        anonymized[key] = '[REDACTED]';
      } else if (key === 'phone') {
        anonymized[key] = '[REDACTED]';
      } else if (key === 'email') {
        anonymized[key] = '[REDACTED]';
      } else if (key === 'address' || key === 'location') {
        anonymized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        anonymized[key] = anonymizeData(value, fieldsToRemove);
      } else {
        anonymized[key] = value;
      }
    }
    return anonymized;
  }
  
  return data;
}

/**
 * Generate consistent anonymous ID
 */
function generateAnonymousId(originalId) {
  const salt = process.env.ANONYMIZATION_SALT || 'medfield-salt';
  return crypto
    .createHash('sha256')
    .update(String(originalId) + salt)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Log data access for HIPAA audit
 */
function logDataAccess(req, dataType, recordId, action) {
  const { logAction } = require('./auditLogger');
  
  logAction(req, 'HIPAA_DATA_ACCESS', {
    dataType,
    recordId: generateAnonymousId(recordId),
    action,
    accessedAt: new Date().toISOString()
  });
}

/**
 * Validate consent status for data processing
 */
function checkConsent(userId, consentType) {
  // This would check against a consent management table
  // Placeholder implementation
  return true; // Default allow if no consent system in place
}

/**
 * Encrypt sensitive fields before storage
 */
function encryptField(value, key = process.env.ENCRYPTION_KEY) {
  if (!key) {
    console.warn('No encryption key set, skipping encryption');
    return value;
  }
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    data: encrypted
  };
}

/**
 * Decrypt sensitive fields after retrieval
 */
function decryptField(encryptedData, key = process.env.ENCRYPTION_KEY) {
  if (!key || typeof encryptedData !== 'object') {
    return encryptedData;
  }
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  detectPHI,
  anonymizeData,
  generateAnonymousId,
  logDataAccess,
  checkConsent,
  encryptField,
  decryptField
};
