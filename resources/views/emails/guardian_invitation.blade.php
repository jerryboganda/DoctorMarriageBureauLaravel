<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Family Guardian Invitation</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; padding: 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 32px 24px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
                    💍 Doctor Marriage Bureau
                </h1>
                <p style="margin: 8px 0 0; color: #94a3b8; font-size: 13px;">Family Portal Invitation</p>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 32px;">
                <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #0f172a;">
                    Dear {{ $guardianName }},
                </p>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                    <strong>{{ $memberName }}</strong> has added you as a <strong>{{ $relationship }}</strong> on their family profile at Doctor Marriage Bureau.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin: 0 0 24px;">
                    <tr>
                        <td style="padding: 20px;">
                            <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">What this means</p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
                                As a family guardian, you are recognized as a trusted family member involved in {{ $memberName }}'s matchmaking journey. Your family's profile appears alongside theirs, building trust and credibility with potential matches.
                            </p>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; margin: 0 0 24px;">
                    <tr>
                        <td style="padding: 20px;">
                            <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Your Role</p>
                            <ul style="margin: 0; padding: 0 0 0 18px; font-size: 14px; line-height: 1.8; color: #1e3a5f;">
                                <li>View potential match profiles shared by {{ $memberName }}</li>
                                <li>Provide approval or feedback on match proposals</li>
                                <li>Help build family trust score (verified guardians add 40%)</li>
                            </ul>
                        </td>
                    </tr>
                </table>

                <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                    You can visit the platform to learn more about Doctor Marriage Bureau and how we connect families for meaningful relationships.
                </p>

                <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                    <tr>
                        <td style="background: #0f172a; border-radius: 10px;">
                            <a href="{{ $portalUrl }}" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">
                                Visit Doctor Marriage Bureau →
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    If you did not expect this invitation or have questions, you can simply ignore this email. No action is required on your part — {{ $memberName }} has already added you to their family profile.
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    © {{ date('Y') }} Doctor Marriage Bureau — Connecting Families with Trust
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
