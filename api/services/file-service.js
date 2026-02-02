// File extraction service
// PDF and DOCX parsing are disabled for Vercel serverless compatibility
// Users should paste text directly instead of uploading files

export async function extractTextFromFile(buffer, mimetype) {
  // Only support plain text files on Vercel
  if (mimetype.startsWith('text/')) {
    return buffer.toString('utf8');
  }

  throw new Error(
    'PDF and DOCX upload not supported on this server. Please copy and paste the text directly.'
  );
}
