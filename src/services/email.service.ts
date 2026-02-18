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

    // Replace with your actual hosted logo URL
    // Note: Use a transparent PNG so it works on both light and dark backgrounds
    const logoUrl = "https://your-domain.com/logo.png";

    const mailOptions = {
        from: `"dispatch.io" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${otp} is your verification code`,
        html: `
        <!DOCTYPE html>
        <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
            
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
                
                :root {
                    color-scheme: light dark;
                    supported-color-schemes: light dark;
                }

                /* Default Light Theme Variables */
                .body-bg { background-color: #f8fafc !important; }
                .card-bg { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; }
                .text-primary { color: #0f172a !important; }
                .text-secondary { color: #64748b !important; }
                .otp-box-bg { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; }

                /* Dark Theme Overrides */
                @media (prefers-color-scheme: dark) {
                    .body-bg { background-color: #121212 !important; }
                    .card-bg { background-color: #1a1a1a !important; border: 1px solid #333333 !important; }
                    .text-primary { color: #ffffff !important; }
                    .text-secondary { color: #a0a0a0 !important; }
                    .otp-box-bg { background-color: #242424 !important; border: 1px solid #333333 !important; }
                }

                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }

                @media screen and (max-width: 600px) {
                    .main-table { width: 95% !important; }
                    .content-padding { padding: 30px 20px !important; }
                }
            </style>
        </head>
        <body class="body-bg">
            <div style="width: 100%; table-layout: fixed; padding-bottom: 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td height="40"></td></tr>
                </table>

                <table class="main-table card-bg" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 500px; margin: 0 auto; border-radius: 24px; overflow: hidden;">
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px 10px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="left" style="display: flex; align-items: center;">
                                        <img src="${logoUrl}" alt="logo" width="28" style="margin-right: 10px; border-radius: 8px;">
                                        <span class="text-primary" style="font-size: 22px; font-weight: 800; letter-spacing: -1px; font-family: 'Outfit', sans-serif;">dispatch.io</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding: 30px 40px 20px 40px;">
                            <h1 class="text-primary" style="font-size: 26px; font-weight: 700; margin: 0 0 15px 0; line-height: 1.2; font-family: 'Outfit', sans-serif;">
                                Verify your account
                            </h1>
                            <p class="text-secondary" style="font-size: 16px; line-height: 1.6; margin: 0; font-family: 'Outfit', sans-serif;">
                                Enter the 6-digit code below to finish setting up your account and start your career journey.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding: 10px 40px 30px 40px;">
                            <table class="otp-box-bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius: 16px;">
                                <tr>
                                    <td align="center" style="padding: 40px 20px;">
                                        <div style="color: #16a34a; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Outfit', sans-serif;">
                                            ${otp}
                                        </div>
                                        <p style="color: #666666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 15px 0 0 0; font-family: 'Outfit', sans-serif;">
                                            Code expires in 10 minutes
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding: 0 40px 40px 40px;">
                             <table width="100%" border="0" cellspacing="0" cellpadding="10">
                                <tr>
                                    <td width="50%" class="otp-box-bg" style="border-radius:12px; padding:15px;">
                                        <p style="margin:0; color:#16a34a; font-size:11px; font-weight:700; text-transform:uppercase; font-family: 'Outfit', sans-serif;">Expires</p>
                                        <p class="text-primary" style="margin:4px 0 0 0; font-size:14px; font-weight:600; font-family: 'Outfit', sans-serif;">10 Mins</p>
                                    </td>
                                    <td width="50%" class="otp-box-bg" style="border-radius:12px; padding:15px;">
                                        <p style="margin:0; color:#16a34a; font-size:11px; font-weight:700; text-transform:uppercase; font-family: 'Outfit', sans-serif;">Security</p>
                                        <p class="text-primary" style="margin:4px 0 0 0; font-size:14px; font-weight:600; font-family: 'Outfit', sans-serif;">Private</p>
                                    </td>
                                </tr>
                            </table>
                            <div style="border-top: 1px solid rgba(128, 128, 128, 0.2); margin-top: 25px; padding-top: 20px;">
                                <p class="text-primary" style="font-size: 14px; font-weight: 600; margin: 0; font-family: 'Outfit', sans-serif;">
                                    The dispatch.io team
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="center" style="padding-top: 30px;">
                            <p style="color: #64748b; font-size: 12px; margin: 0; font-family: 'Outfit', sans-serif;">
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
        console.log(`✅ Success: Dynamic Outfit OTP sent to ${to}`);
    } catch (error) {
        console.error("❌ Nodemailer Error:", error);
        throw error;
    }
};