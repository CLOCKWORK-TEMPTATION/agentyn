/**
 * Security Helper Functions
 * دوال مساعدة للأمان والتحقق من المدخلات
 */

import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

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
  if (!resolvedRequested.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected: Access denied');
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
    .replace(/[\r\n]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[|&;$%'"<>()]/g, '_');
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
 * Validates URL to prevent SSRF attacks
 * تحقق من الرابط لمنع هجمات SSRF
 */
export function validateUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block localhost and private IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.')) {
      return false;
    }
    
    // Check against allowed domains if provided
    if (allowedDomains.length > 0 && !allowedDomains.includes(hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely executes shell commands to prevent command injection
 * تنفيذ أوامر Shell بأمان لمنع حقن الأوامر
 */
export async function safeExec(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  // Validate that command doesn't contain dangerous characters
  if (/[;&|`$(){}[\]]/.test(command)) {
    throw new Error('Invalid command characters detected');
  }
  
  // Validate each argument
  for (const arg of args) {
    if (/[;&|`$(){}[\]]/.test(arg)) {
      throw new Error('Invalid argument characters detected');
    }
  }
  
  return execFileAsync(command, args);
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
 * Generates CSRF token
 * توليد رمز CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates CSRF token
 * تحقق من رمز CSRF
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 64;
}

/**
 * Sanitizes filename to prevent path traversal
 * تنظيف اسم الملف لمنع اجتياز المسار
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    throw new Error('Filename must be a string');
  }
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Validates and sanitizes user input
 * تحقق وتنظيف مدخلات المستخدم
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
