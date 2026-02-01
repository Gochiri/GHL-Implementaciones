import { PDFParse as pdf } from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromFile(buffer, mimetype) {
    console.log(`📂 Extracting text from ${mimetype}...`);
    if (mimetype === 'application/pdf') {
        try {
            const parser = new pdf({ data: buffer });
            const result = await parser.getText();
            await parser.destroy(); // Important to cleanup
            return result.text;
        } catch (err) {
            console.error('❌ PDF extraction error:', err);
            throw err;
        }
    } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
    ) {
        const data = await mammoth.extractRawText({ buffer });
        return data.value;
    } else if (mimetype.startsWith('text/')) {
        return buffer.toString('utf8');
    } else {
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
}
