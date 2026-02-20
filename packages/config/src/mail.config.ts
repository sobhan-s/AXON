import nodemailer from 'nodemailer';
import { env_config_variable } from './env.config.js';
import { logger } from './logger.config.js';
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

const smtpOptions: SMTPTransport.Options = {
  host: env_config_variable.MAIL.HOST,
  port: Number(env_config_variable.MAIL.PORT),
  secure: false,
  auth: {
    user: env_config_variable.MAIL.USER,
    pass: env_config_variable.MAIL.PASSWORD,
  },
};

// console.log('asdfasdfasdfads', smtpOptions);

const transporter = nodemailer.createTransport(smtpOptions);

transporter.verify((error, success) => {
  if (error) {
    logger.error('Mail server connection failed', error);
  } else {
    logger.info('Mail server ready');
  }
});

export { transporter };
