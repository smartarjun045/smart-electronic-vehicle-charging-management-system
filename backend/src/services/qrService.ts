import QRCode from 'qrcode';

/** Generates a QR code image (data URL) that encodes ONLY an opaque token — never PII. */
export async function generateQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, { errorCorrectionLevel: 'M', margin: 2, width: 300 });
}
