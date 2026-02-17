import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
    const mailOptions = {
        from: `"Dispatch.io Support" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify your Dispatch.io account',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2e7d32; text-align: center;">Welcome to Dispatch.io</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Thank you for joining us. Use the following One-Time Password (OTP) to verify your email address. This code is valid for <b>10 minutes</b>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; border: 2px dashed #2e7d32; padding: 10px 20px; border-radius: 5px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};