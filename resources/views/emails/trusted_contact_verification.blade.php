<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trusted Contact Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <tr>
            <td style="padding: 24px 24px 0;">
                <h2 style="margin: 0 0 12px;">Trusted Contact Verification</h2>
                <p style="margin: 0 0 12px;">Hi {{ $contactName }},</p>
                <p style="margin: 0 0 16px;">
                    {{ $userName }} added you as a trusted contact. Please confirm to help with account recovery and security alerts.
                </p>
                <p style="margin: 0 0 24px;">
                    <a href="{{ $verifyUrl }}" style="background: #0f172a; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Trusted Contact</a>
                </p>
                <p style="margin: 0 0 16px; font-size: 12px; color: #64748b;">
                    If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 24px; font-size: 12px; color: #2563eb;">
                    {{ $verifyUrl }}
                </p>
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">If you did not expect this request, you can ignore this email.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 24px 24px; font-size: 12px; color: #94a3b8;">
                {{ config('app.name') }}
            </td>
        </tr>
    </table>
</body>
</html>
