/**
 * Security Helper Functions - Enhanced Version
 * دوال مساعدة للأمان والتحقق من المدخلات - نسخة محسنة
 */

import * as path from 'path';
import * as crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execFileAsync = promisify(execFile);

/**
 * Validates that a path is within the allowed base directory
 * تحقق من أن المسار ضمن المجلد الأساسي المسموح به
 */
export function validatePath(baseDir: string, requestedPath: string): string {
  // Resolve the absolute paths
  const resolvedBase = path.resolve(baseDir);
  const resolvedRequested = path.resolve(baseDir, requestedPath);
  
  // Check if the resolved path is within the base directory
  if (!resolvedRequested.startsWith(resolvedBase + path.sep) && resolvedRequested !== resolvedBase) {
    throw new Error('Path traversal detected: Access denied');
  }
  
  // Additional check for symbolic links
  try {
    const stats = fs.lstatSync(resolvedRequested);
    if (stats.isSymbolicLink()) {
      const realPath = fs.realpathSync(resolvedRequested);
      if (!realPath.startsWith(resolvedBase + path.sep) && realPath !== resolvedBase) {
        throw new Error('Symbolic link points outside allowed directory');
      }
    }
  } catch (error) {
    // File doesn't exist yet, which is okay for write operations
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
  
  return resolvedRequested;
}

/**
 * Sanitizes input for logging to prevent log injection
 * تنظيف المدخلات للتسجيل لمنع حقن السجلات
 */
export function sanitizeLogInput(input: any): string {
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  // Remove newlines, carriage returns, and other control characters
  return input
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[|&;$%'"<>()]/g, '_')
    .substring(0, 500); // Limit length
}

/**
 * Escapes HTML to prevent XSS attacks
 * تهريب HTML لمنع هجمات XSS
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    unsafe = String(unsafe);
  }
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Enhanced URL validation to prevent SSRF attacks
 * تحقق محسن من الرابط لمنع هجمات SSRF
 */
export function validateUrl(url: string, allowedDomains: string[] = []): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'البروتوكول غير مسموح، يُسمح فقط بـ HTTP/HTTPS' };
    }
    
    // Block localhost and private IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = [
      'localhost', '127.0.0.1', '::1', '0.0.0.0',
      '169.254.169.254', // AWS metadata
      'metadata.google.internal', // GCP metadata
      'metadata.azure.com', // Azure metadata
    ];
    
    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: 'لا يُسمح بالوصول إلى العناوين المحلية أو الداخلية' };
    }
    
    // Enhanced private IP range checking
    const privateRanges = [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^fc00:/i, // IPv6 private
      /^fe80:/i, // IPv6 link-local
    ];
    
    if (privateRanges.some(range => range.test(hostname))) {
      return { valid: false, error: 'لا يُسمح بالوصول إلى عناوين IP الخاصة' };
    }
    
    // Check against allowed domains if provided
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      if (!isAllowed) {
        return { valid: false, error: `النطاق غير مسموح. النطاقات المسموحة: ${allowedDomains.join(', ')}` };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'URL غير صالح' };
  }
}

/**
 * Enhanced safe command execution with whitelist
 * تنفيذ أوامر Shell بأمان مع قائمة بيضاء
 */
export async function safeExec(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  // Whitelist of allowed commands
  const allowedCommands = [
    'dir', 'ls', 'pwd', 'echo', 'cat', 'head', 'tail',
    'find', 'grep', 'wc', 'sort', 'uniq', 'date',
    'node', 'npm', 'git', 'tsc', 'tsx'
  ];
  
  // Check if command is in whitelist
  const baseCommand = path.basename(command);
  if (!allowedCommands.includes(baseCommand.toLowerCase())) {
    throw new Error(`Command not allowed: ${baseCommand}`);
  }
  
  // Validate that command doesn't contain dangerous characters
  if (/[;&|`$(){}[\]<>]/.test(command)) {
    throw new Error('Invalid command characters detected');
  }
  
  // Validate each argument
  for (const arg of args) {
    if (/[;&|`$(){}[\]<>]/.test(arg)) {
      throw new Error('Invalid argument characters detected');
    }
    // Prevent extremely long arguments
    if (arg.length > 1000) {
      throw new Error('Argument too long');
    }
  }
  
  // Set timeout and resource limits
  return execFileAsync(command, args, {
    timeout: 30000, // 30 seconds
    maxBuffer: 1024 * 1024, // 1MB
    env: {}, // Clean environment
  });
}

/**
 * Creates a parameterized SQL query to prevent SQL injection
 * إنشاء استعلام SQL معلمات لمنع حقن SQL
 */
export function createParameterizedQuery(template: string, params: any[]): { query: string; values: any[] } {
  // Simple parameter replacement - in production, use a proper library like pg or mysql2
  let query = template;
  const values: any[] = [];
  
  for (let i = 0; i < params.length; i++) {
    const placeholder = `$${i + 1}`;
    if (query.includes(placeholder)) {
      query = query.replace(placeholder, '?');
      values.push(params[i]);
    }
  }
  
  return { query, values };
}

/**
 * Generates secure CSRF token using Node.js crypto
 * توليد رمز CSRF آمن باستخدام crypto في Node.js
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates CSRF token with timing-safe comparison
 * تحقق من رمز CSRF مع مقارنة آمنة زمنياً
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken || token.length !== 64 || sessionToken.length !== 64) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(sessionToken, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Enhanced filename sanitization
 * تنظيف محسن لاسم الملف
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    throw new Error('Filename must be a string');
  }
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Enhanced input validation and sanitization
 * تحقق وتنظيف محسن لمدخلات المستخدم
 */
export function sanitizeInput(input: any, maxLength: number = 1000): string {
  if (input === null || input === undefined) {
    return '';
  }
  
  let str = String(input);
  
  // Limit length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  
  // Remove null bytes and control characters
  str = str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return str;
}

/**
 * Rate limiting helper
 * مساعد تحديد معدل الطلبات
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Content Security Policy helper
 * مساعد سياسة أمان المحتوى
 */
export function generateCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'",
  ].join('; ');
}