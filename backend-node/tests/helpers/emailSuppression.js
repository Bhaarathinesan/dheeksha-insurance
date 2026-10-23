/**
 * Integration Test Email Suppression Helper
 *
 * Guarantees that no real SMTP network connections are initiated
 * during integration testing by enforcing mock transporter injection.
 */

import { setTransporter, getTransporter } from '../../src/services/email.service.js';

let activeSuppression = false;
let capturedEmails = [];

/**
 * Installs a strict mock transporter into the email service.
 * Guarantees zero SMTP network traffic during test execution.
 *
 * @returns {{ getSentEmails: () => Array<Object>, restore: () => void }}
 */
export function installEmailSuppression() {
  capturedEmails = [];
  activeSuppression = true;

  const mockTransporter = {
    async sendMail(mailOptions) {
      if (!activeSuppression) {
        throw new Error('CRITICAL SAFETY ERROR: Attempted to send email without active suppression!');
      }
      capturedEmails.push({
        ...mailOptions,
        capturedAt: new Date().toISOString(),
      });
      return { messageId: `suppressed-mock-${Date.now()}` };
    },
  };

  setTransporter(mockTransporter);

  return {
    getSentEmails() {
      return [...capturedEmails];
    },
    restore() {
      activeSuppression = false;
      capturedEmails = [];
      setTransporter(null);
    },
  };
}

/**
 * Checks whether email delivery is currently suppressed with an active mock transporter.
 * @returns {boolean}
 */
export function isEmailSuppressionActive() {
  return activeSuppression;
}

/**
 * Asserts that email delivery is currently suppressed.
 * Throws immediately if email suppression cannot be verified.
 */
export function assertEmailSuppressed() {
  if (!activeSuppression) {
    throw new Error(
      'CRITICAL SAFETY ERROR: Email suppression is not active. Live integration tests require active email suppression.'
    );
  }
}
