import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a clean PNG Data URL for a room invitation URL.
 * Designed with high contrast and error correction suitable for scanning.
 */
export async function generateRoomQRCode(
  inviteUrl: string,
  options?: QRCodeOptions
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(inviteUrl, {
      width: options?.width || 320,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#17120F', // Brand foreground
        light: options?.color?.light || '#FFFDF9', // Brand warm-white
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    throw new Error('Could not generate QR code for room');
  }
}
