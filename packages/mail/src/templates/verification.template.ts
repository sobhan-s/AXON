import { transporter } from '@dam/config';
import { env_config_variable } from '@dam/config';
import { logger } from '@dam/config';

const baseUrl = 'http://localhost:5173';
export const sendVerificationEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: env_config_variable.MAIL.FROM,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 40px;">
          <h2 style="color: #1a1a2e;">Verify Your Email</h2>
          <p>Click below to verify your account:</p>
          <a href="${verificationUrl}" style="padding: 12px 24px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
          <p style="font-size: 14px; color: #888;">Link expires in 24 hours.</p>
        </div>
      `,
    });

    logger.info('Verification email sent', { email });
  } catch (error) {
    logger.error('Failed to send verification email', { email, error });
    throw new Error('Failed to send verification email');
  }
};
