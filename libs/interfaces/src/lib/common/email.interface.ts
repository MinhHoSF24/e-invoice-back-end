export type MailAttachment = {
  filename: string;
  content?: Buffer | string;
  contentType?: string;
  path?: string; // nếu gửi file từ URL hoặc path local
};

export interface SendMailOptions {
  to: string; // Receiver's email address
  subject: string; // Subject of the email
  html?: string; // HTML content
  text?: string; // Plain text fallback (optional)
  senderName?: string; // Name of the sender
  senderEmail?: string; // Email of the sender
  attachments?: MailAttachment[]; // File attachments (PDF, image, etc.)
}
