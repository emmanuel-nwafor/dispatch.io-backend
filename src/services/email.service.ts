import nodemailer from 'nodemailer';

const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials are missing in process.env");
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        family: 4,
        connectionTimeout: 15000,
        tls: {
            rejectUnauthorized: false,
            minVersion: "TLSv1.2"
        }
    } as any);
};

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
    const transporter = getTransporter();

    // logo url
    const logoUrl = "https://res.cloudinary.com/dquiwougr/image/upload/v1771442418/logo_kbcdsq.png";

    const mailOptions = {
        from: `"dispatch.io" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${otp} is your verification code`,
        html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
            
            :root {
                color-scheme: light dark;
                supported-color-schemes: light dark;
            }

            /* Reset for email clients */
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            
            * { font-family: "Outfit", sans-serif; }
                
            body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #ffffff; /* Default Light BG */
            }

            .wrapper {
                width: 100%;
                table-layout: fixed;
                padding-bottom: 40px;
                background-color: #f9fafb;
            }

            .main-table {
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }

            /* Dark Mode Styles */
            @media (prefers-color-scheme: dark) {
                body, .wrapper { background-color: #000000 !important; }
                .main-table { background-color: #111111 !important; border-color: #222222 !important; }
                .text-main { color: #ffffff !important; }
                .text-sub { color: #a0a0a0 !important; }
                .otp-box { background-color: #242424 !important; border-color: #333333 !important; }
                .footer-text { color: #444444 !important; }
            }

            @media screen and (max-width: 600px) {
                .main-table { width: 95% !important; }
                .content-padding { padding: 30px 20px !important; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="40"></td></tr>
            </table>

            <table class="main-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td class="content-padding" style="padding: 40px 40px 10px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="left" style="display: flex; align-items: center;">
                                    <img src="${logoUrl}" alt="logo" width="28" style="margin-right: 10px; border-radius: 8px;">
                                    <span class="text-main" style="color: #111111; font-size: 22px; font-weight: 800; letter-spacing: -1px;">dispatch.io</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td class="content-padding" style="padding: 30px 40px 20px 40px;">
                        <h1 class="text-main" style="color: #111111; font-size: 26px; font-weight: 700; margin: 0 0 15px 0; line-height: 1.2;">
                            Verify your account
                        </h1>
                        <p class="text-sub" style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
                            Enter the 6-digit code below to finish setting up your account and start your career journey.
                        </p>
                    </td>
                </tr>

                <tr>
                    <td class="content-padding" style="padding: 10px 40px 30px 40px;">
                        <table class="otp-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; border-radius: 16px; border: 1px solid #e5e7eb;">
                            <tr>
                                <td align="center" style="padding: 40px 20px;">
                                    <div style="color: #16a34a; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                                        ${otp}
                                    </div>
                                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 15px 0 0 0;">
                                        Code expires in 10 minutes
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td class="content-padding" style="padding: 0 40px 40px 40px;">
                        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
                            Security tip: Never share this code with anyone. Our team will never ask for your OTP via email or chat.
                        </p>
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            <p class="text-main" style="color: #111111; font-size: 14px; font-weight: 600; margin: 0;">
                                The dispatch.io team
                            </p>
                        </div>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" style="padding-top: 30px;">
                        <p class="footer-text" style="color: #9ca3af; font-size: 12px; margin: 0;">
                            &copy; ${new Date().getFullYear()} dispatch.io — AI for professionals
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Success: Lottie-style OTP sent to ${to}`);
    } catch (error) {
        console.error("❌ Nodemailer Error:", error);
        throw error;
    }
};