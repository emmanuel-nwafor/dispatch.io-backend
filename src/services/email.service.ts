import nodemailer from 'nodemailer';

// Senior Guard: This will catch the error immediately on startup if variables are missing
const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials are missing in process.env");
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
    const transporter = getTransporter(); // Create or get the transporter when needed

    const mailOptions = {
        from: `"Dispatch.io Support" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify your Dispatch.io account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2e7d32; text-align: center;">Welcome to Dispatch.io</h2>
                <p>Use the following One-Time Password (OTP) to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; border: 2px dashed #2e7d32; padding: 10px 20px; border-radius: 5px;">
                        ${otp}
                    </span>
                </div>
                <p style="font-size: 12px; color: #888; text-align: center;">This code is valid for 10 minutes.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};