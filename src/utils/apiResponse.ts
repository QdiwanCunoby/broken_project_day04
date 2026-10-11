// Envelope standard delle risposte API
export interface FieldError { field: string; message: string }
export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure { success: false; error: { code: string; message: string; details?: FieldError[] } }

export const ok = <T>(data: T): ApiSuccess<T> => ({ success: true, data });

export const fail = (code: string, message: string, details?: FieldError[]): ApiFailure => ({
  success: false,
  error: details ? { code, message, details } : { code, message },
});
