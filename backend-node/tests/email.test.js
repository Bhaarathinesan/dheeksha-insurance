import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { setPool, closePool } from '../src/config/database.js';
import { resetConfig, getConfig } from '../src/config/env.js';
import { resetEnquiryRateLimit } from '../src/middlewares/rateLimiter.middleware.js';
import {
  buildEnquiryEmail,
  escapeHtml,
  formatVehicleType,
  formatRequirement,
  formatSubmissionTime,
  setTransporter,
  sendEnquiryNotification,
  waitForPendingNotifications,
} from '../src/services/email.service.js';

describe('Email Notification Service and Background Dispatch', () => {
  let server;
  let baseUrl;
  let mockSentEmails = [];
  let shouldFailSmtp = false;
  let enquiriesStore = [];
  let simulateDbError = false;

  const testSecretKey = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';

  before(async () => {
    process.env.SECRET_KEY = testSecretKey;
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8000';
    process.env.SMTP_USER = 'business@dheekshainsurance.com';
    process.env.SMTP_PASSWORD = 'mock-app-password-1234';
    process.env.NOTIFICATION_EMAIL = 'neelkanthbpvi@gmail.com';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';

    resetConfig();
    getConfig();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    setTransporter(null);
    await closePool();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockSentEmails = [];
    shouldFailSmtp = false;
    enquiriesStore = [];
    simulateDbError = false;
    resetEnquiryRateLimit('127.0.0.1');

    // Mock Nodemailer Transporter
    const mockTransporter = {
      async sendMail(mailOptions) {
        if (shouldFailSmtp) {
          const err = new Error('SMTP connection lost');
          err.code = 'ETIMEDOUT';
          throw err;
        }
        mockSentEmails.push(mailOptions);
        return { messageId: `mock-msg-${Date.now()}` };
      },
    };
    setTransporter(mockTransporter);

    // Mock Database Pool
    const mockPool = {
      async execute(sql, params) {
        if (simulateDbError) {
          const err = new Error('Database write failure');
          err.code = 'ECONNRESET';
          throw err;
        }

        if (sql.includes('INSERT INTO enquiries')) {
          const [
            id, full_name, mobile_number, whatsapp_number,
            vehicle_type, vehicle_registration_number,
            requirement, message, status, created_at, updated_at
          ] = params;

          const row = {
            id,
            full_name,
            mobile_number,
            whatsapp_number: whatsapp_number ?? null,
            vehicle_type,
            vehicle_registration_number: vehicle_registration_number ?? null,
            requirement,
            message: message ?? null,
            status: status || 'NEW',
            created_at: new Date(created_at),
            updated_at: new Date(updated_at),
          };
          enquiriesStore.push(row);
          return [{ affectedRows: 1 }];
        }

        if (sql.includes('SELECT') && sql.includes('FROM enquiries') && sql.includes('WHERE id = ?')) {
          const id = params[0];
          const found = enquiriesStore.find((e) => e.id === id);
          return [found ? [{ ...found }] : []];
        }

        return [[]];
      },
      async query(sql) {
        return [[]];
      },
      async end() {},
    };
    setPool(mockPool);
  });

  // =========================================================================
  // 1. FORMATTING & BUILDING NOTIFICATION TESTS
  // =========================================================================

  test('buildEnquiryEmail sets correct subject, sender, and recipient', () => {
    const enquiry = {
      id: 'uuid-1234',
      full_name: 'Kavitha Devi',
      mobile_number: '9876543210',
      vehicle_type: 'private-car',
      requirement: 'renewal',
    };

    const mail = buildEnquiryEmail(enquiry);
    assert.equal(mail.subject, 'New Customer Enquiry — Dheeksha Insurance');
    assert.equal(mail.to, 'neelkanthbpvi@gmail.com');
    assert.ok(mail.from.includes('Dheeksha Insurance'));
    assert.ok(mail.from.includes('business@dheekshainsurance.com'));
  });

  test('buildEnquiryEmail formats all enquiry fields properly in text and HTML', () => {
    const enquiry = {
      id: 'uuid-5678',
      full_name: 'Rajesh Selvam',
      mobile_number: '9123456780',
      whatsapp_number: '9123456780',
      vehicle_type: 'two-wheeler',
      vehicle_registration_number: 'TN 49 AB 1234',
      requirement: 'new-insurance',
      message: 'Please send quotation with zero depreciation add-on.',
      created_at: '2026-10-23T08:30:00.000Z',
    };

    const mail = buildEnquiryEmail(enquiry);

    // Assert text alternative contains all fields
    assert.ok(mail.text.includes('Rajesh Selvam'));
    assert.ok(mail.text.includes('9123456780'));
    assert.ok(mail.text.includes('Two-Wheeler'));
    assert.ok(mail.text.includes('TN 49 AB 1234'));
    assert.ok(mail.text.includes('New Insurance'));
    assert.ok(mail.text.includes('Please send quotation with zero depreciation add-on.'));
    assert.ok(mail.text.includes('uuid-5678'));

    // Assert HTML contains all fields
    assert.ok(mail.html.includes('Rajesh Selvam'));
    assert.ok(mail.html.includes('9123456780'));
    assert.ok(mail.html.includes('Two-Wheeler'));
    assert.ok(mail.html.includes('TN 49 AB 1234'));
    assert.ok(mail.html.includes('New Insurance'));
    assert.ok(mail.html.includes('Please send quotation with zero depreciation add-on.'));
    assert.ok(mail.html.includes('uuid-5678'));
  });

  test('buildEnquiryEmail handles missing optional fields gracefully', () => {
    const enquiry = {
      id: 'uuid-minimal',
      full_name: 'Anand Kumar',
      mobile_number: '9876543210',
      vehicle_type: 'commercial',
      requirement: 'claim',
      // whatsapp_number, vehicle_registration_number, message are omitted/null
      whatsapp_number: null,
      vehicle_registration_number: null,
      message: null,
    };

    const mail = buildEnquiryEmail(enquiry);

    assert.ok(mail.text.includes('WhatsApp Number:         Not provided'));
    assert.ok(mail.text.includes('Registration Number:     Not provided'));
    assert.ok(mail.text.includes('Message:                 Not provided'));

    assert.ok(mail.html.includes('Not provided'));
  });

  test('escapeHtml prevents HTML and script injection from customer input', () => {
    const maliciousInput = '<script>alert("XSS")</script>&<img src=x onerror=\'steal()\'>';
    const escaped = escapeHtml(maliciousInput);

    assert.ok(!escaped.includes('<script>'));
    assert.ok(!escaped.includes('<img'));
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&amp;'));
    assert.ok(escaped.includes('&#39;'));
    assert.ok(escaped.includes('&quot;'));

    const enquiry = {
      id: 'uuid-xss',
      full_name: '<script>alert("name")</script>',
      mobile_number: '9876543210',
      vehicle_type: 'other',
      requirement: 'other',
      message: '<b>Malicious Bold</b> & "quoted"',
    };

    const mail = buildEnquiryEmail(enquiry);
    assert.ok(!mail.html.includes('<script>alert'));
    assert.ok(mail.html.includes('&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;'));
    assert.ok(mail.html.includes('&lt;b&gt;Malicious Bold&lt;/b&gt; &amp; &quot;quoted&quot;'));
  });

  test('Plain-text alternative is readable and completely free of HTML tags', () => {
    const enquiry = {
      id: 'uuid-plain',
      full_name: 'Suresh Raina',
      mobile_number: '9876543210',
      vehicle_type: 'private-car',
      requirement: 'renewal',
      message: 'Need renewal asap.',
    };

    const mail = buildEnquiryEmail(enquiry);
    assert.ok(!mail.text.includes('<table'));
    assert.ok(!mail.text.includes('<html'));
    assert.ok(!mail.text.includes('<td'));
    assert.ok(mail.text.includes('New Customer Enquiry — Dheeksha Insurance'));
    assert.ok(mail.text.includes('Customer Name:           Suresh Raina'));
  });

  // =========================================================================
  // 2. EMAIL DELIVERY & SMTP ERROR HANDLING TESTS
  // =========================================================================

  test('sendEnquiryNotification successfully delivers email with mock transporter', async () => {
    const result = await sendEnquiryNotification({
      id: 'uuid-success',
      full_name: 'Successful Customer',
      mobile_number: '9876543210',
      vehicle_type: 'two-wheeler',
      requirement: 'new-insurance',
    });

    assert.equal(result.sent, true);
    assert.equal(mockSentEmails.length, 1);
    assert.equal(mockSentEmails[0].to, 'neelkanthbpvi@gmail.com');
  });

  test('sendEnquiryNotification handles SMTP failure safely without throwing', async () => {
    shouldFailSmtp = true;

    const result = await sendEnquiryNotification({
      id: 'uuid-fail',
      full_name: 'Failing Customer',
      mobile_number: '9876543210',
      vehicle_type: 'two-wheeler',
      requirement: 'new-insurance',
    });

    assert.equal(result.sent, false);
    assert.equal(result.error, 'ETIMEDOUT');
    assert.equal(mockSentEmails.length, 0);
  });

  test('sendEnquiryNotification skips dispatch safely when SMTP is unconfigured', async () => {
    // Unset custom mock transporter and remove SMTP_USER/PASSWORD
    setTransporter(null);
    const origUser = process.env.SMTP_USER;
    const origPass = process.env.SMTP_PASSWORD;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    resetConfig();

    const result = await sendEnquiryNotification({
      id: 'uuid-unconfigured',
      full_name: 'Unconfigured Customer',
      mobile_number: '9876543210',
      vehicle_type: 'two-wheeler',
      requirement: 'new-insurance',
    });

    assert.equal(result.sent, false);
    assert.equal(result.reason, 'unconfigured');

    // Restore configuration
    process.env.SMTP_USER = origUser;
    process.env.SMTP_PASSWORD = origPass;
    resetConfig();
  });

  // =========================================================================
  // 3. BACKGROUND DISPATCH INTEGRATION TESTS (POST /api/v1/enquiries)
  // =========================================================================

  test('POST /api/v1/enquiries triggers exactly one email notification on successful save', async () => {
    const payload = {
      full_name: 'Meena Kumari',
      mobile_number: '9876543210',
      whatsapp_number: '9876543210',
      vehicle_type: 'two-wheeler',
      vehicle_registration_number: 'TN 38 Z 5555',
      requirement: 'new-insurance',
      message: 'Need policy immediately.',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);

    // Wait for in-flight background dispatch to complete
    await waitForPendingNotifications();

    assert.equal(mockSentEmails.length, 1);
    const sentEmail = mockSentEmails[0];
    assert.equal(sentEmail.to, 'neelkanthbpvi@gmail.com');
    assert.ok(sentEmail.text.includes('Meena Kumari'));
    assert.ok(sentEmail.html.includes('TN 38 Z 5555'));
    assert.ok(sentEmail.html.includes(body.id));
  });

  test('POST /api/v1/enquiries invalid input does NOT trigger email notification', async () => {
    const invalidPayload = {
      full_name: 'A', // Too short (<2)
      mobile_number: '123', // Invalid phone
      vehicle_type: 'invalid-vehicle',
      requirement: 'invalid-requirement',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    assert.equal(res.status, 422);
    await waitForPendingNotifications();

    assert.equal(mockSentEmails.length, 0);
  });

  test('POST /api/v1/enquiries database failure does NOT trigger email notification', async () => {
    simulateDbError = true;

    const payload = {
      full_name: 'Database Fail User',
      mobile_number: '9876543210',
      vehicle_type: 'private-car',
      requirement: 'renewal',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 500);
    await waitForPendingNotifications();

    assert.equal(mockSentEmails.length, 0);
  });

  test('Email delivery failure does NOT undo or roll back successfully saved enquiry', async () => {
    shouldFailSmtp = true; // Smtp fails

    const payload = {
      full_name: 'Resilient Customer',
      mobile_number: '9876543210',
      vehicle_type: 'two-wheeler',
      requirement: 'new-insurance',
      message: 'Ensure record is saved even if SMTP fails.',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Customer still receives HTTP 201 Created
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.full_name, 'Resilient Customer');

    await waitForPendingNotifications();

    // Verify enquiry was preserved in the database
    const saved = enquiriesStore.find((e) => e.id === body.id);
    assert.ok(saved, 'Enquiry must remain saved in database');
    assert.equal(saved.full_name, 'Resilient Customer');

    // Customer response must not leak any SMTP error details
    assert.equal(body.error, undefined);
    assert.equal(body.smtp_error, undefined);
  });

  test('Customer API responses do not expose internal email configuration or secrets', async () => {
    const payload = {
      full_name: 'Security Check User',
      mobile_number: '9876543210',
      vehicle_type: 'private-car',
      requirement: 'claim',
    };

    const res = await fetch(`${baseUrl}/api/v1/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    const responseString = JSON.stringify(body);
    assert.ok(!responseString.includes('mock-app-password-1234'));
    assert.ok(!responseString.includes(testSecretKey));
    assert.ok(!responseString.includes('smtp.gmail.com'));
  });
});
