import { transporter } from '@dam/config/mail';
import { env_config_variable } from '@dam/config/env_variables';
import { logger } from '@dam/config/logs';

const baseUrl = 'http://localhost:8000/api/v1/auth';

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: env_config_variable.MAIL.FROM,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 40px;">
          <h2 style="color: #1a1a2e;">Reset Your Password</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetUrl}" style="padding: 12px 24px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #888;">Link expires in 1 hour.</p>
        </div>
      `,
    });

    logger.info('Password reset email sent', { email });
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error });
    throw new Error('Failed to send password reset email');
  }
};
