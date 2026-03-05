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

const emailLayout = (title: string, body: string, actionContent: string = "") => {
    const logoUrl = "https://res.cloudinary.com/dquiwougr/image/upload/v1771442418/logo_kbcdsq.png";
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            :root { color-scheme: light dark; }
            body { margin: 0; padding: 0; width: 100%; background-color: #f9fafb; font-family: "Outfit", sans-serif; }
            .wrapper { width: 100%; padding-bottom: 40px; background-color: #f9fafb; }
            .main-table { width: 100%; max-width: 500px; margin: 20px auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; }
            @media (prefers-color-scheme: dark) {
                body, .wrapper { background-color: #000000 !important; }
                .main-table { background-color: #111111 !important; border-color: #222222 !important; }
                .text-main { color: #ffffff !important; }
                .text-sub { color: #a0a0a0 !important; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <table class="main-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding: 40px 40px 10px 40px;">
                        <div style="display: flex; align-items: center;">
                            <img src="${logoUrl}" alt="logo" width="28" style="margin-right: 10px; border-radius: 8px;">
                            <span class="text-main" style="color: #111111; font-size: 22px; font-weight: 800; letter-spacing: -1px;">dispatch.io</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px 40px;">
                        <h1 class="text-main" style="color: #111111; font-size: 26px; font-weight: 700; margin-bottom: 15px;">${title}</h1>
                        <p class="text-sub" style="color: #4b5563; font-size: 16px; line-height: 1.6;">${body}</p>
                    </td>
                </tr>
                ${actionContent}
                <tr>
                    <td style="padding: 0 40px 40px 40px;">
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            <p class="text-main" style="color: #111111; font-size: 14px; font-weight: 600;">The dispatch.io team</p>
                        </div>
                    </td>
                </tr>
            </table>
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} dispatch.io — AI for professionals</p>
        </div>
    </body>
    </html>`;
};

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
    const transporter = getTransporter();
    const action = `
        <tr>
            <td style="padding: 10px 40px 30px 40px;">
                <div style="background-color: #f3f4f6; border-radius: 16px; border: 1px solid #e5e7eb; padding: 40px 20px; text-align: center;">
                    <div style="color: #16a34a; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</div>
                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 15px;">Expires in 10 minutes</p>
                </div>
            </td>
        </tr>`;

    const html = emailLayout("Verify your account", "Enter the 6-digit code below to finish setting up your account.", action);
    await transporter.sendMail({ from: `"dispatch.io" <${process.env.EMAIL_USER}>`, to, subject: `${otp} is your verification code`, html });
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
    const transporter = getTransporter();
    const action = `
        <tr>
            <td style="padding: 10px 40px 30px 40px;">
                <a href="https://dispatch.io/profile" style="display: inline-block; padding: 14px 28px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;">Complete Your Profile</a>
            </td>
        </tr>`;

    const html = emailLayout(`Welcome, ${name}! 🚀`, "Your account is verified. You're now ready to discover roles curated specifically for your skills.", action);
    await transporter.sendMail({ from: `"dispatch.io" <${process.env.EMAIL_USER}>`, to, subject: "Welcome to dispatch.io", html });
};

export const sendApplicationStatusEmail = async (to: string, jobTitle: string, status: string): Promise<void> => {
    const transporter = getTransporter();
    const html = emailLayout("Application Update", `Your application for <strong>${jobTitle}</strong> has been moved to: <strong>${status}</strong>.`);
    await transporter.sendMail({ from: `"dispatch.io" <${process.env.EMAIL_USER}>`, to, subject: `Update on your application for ${jobTitle}`, html });
};

export const sendRecruiterAlert = async (to: string, jobTitle: string): Promise<void> => {
    const transporter = getTransporter();
    const html = emailLayout("New Applicant! 👋", `A new candidate just applied for <strong>${jobTitle}</strong>. Check your dashboard to review their profile.`);
    await transporter.sendMail({ from: `"dispatch.io" <${process.env.EMAIL_USER}>`, to, subject: `New candidate for ${jobTitle}`, html });
};