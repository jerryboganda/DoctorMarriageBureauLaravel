<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification Code</title>
</head>

<body style="margin: 0; padding: 0; background-color: #e8ebef; font-family: Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#e8ebef">
        <tr>
            <td align="center" valign="top" style="padding: 50px 10px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center">
                            <table width="650" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px;">
                                <tr>
                                    <td bgcolor="#ffffff"
                                        style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                        <!-- Header -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                            bgcolor="#ffffff">
                                            <tr>
                                                <td style="padding: 40px 30px 0px 30px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center">
                                                                @php
                                                                    $logo = get_setting('header_logo');
                                                                    $appName = env('APP_NAME', 'Matrimonial Site');
                                                                @endphp
                                                                <img src="https://panel.doctormarriagebureau.com.pk/logo-v2.png"
                                                                    width="200" height="auto" border="0"
                                                                    alt="Doctors Marriage Bureau"
                                                                    style="max-width: 200px; height: auto;" />
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- END Header -->

                                        <!-- Content -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                            bgcolor="#ffffff">
                                            <tr>
                                                <td style="padding: 40px 30px 50px 30px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center"
                                                                style="color: #000000; font-size: 28px; line-height: 34px; font-weight: bold; padding-bottom: 20px;">
                                                                Email Verification Code
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center"
                                                                style="color: #666666; font-size: 16px; line-height: 24px; padding-bottom: 30px;">
                                                                Hello! Please use the verification code below to
                                                                complete your email verification.
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center" style="padding-bottom: 30px;">
                                                                <div
                                                                    style="background: #f8f9fa; border: 2px dashed #e67f98; border-radius: 8px; padding: 20px; display: inline-block;">
                                                                    <span
                                                                        style="color: #e67f98; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">{{ $verificationCode }}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center"
                                                                style="color: #999999; font-size: 14px; line-height: 20px; padding-bottom: 20px;">
                                                                This code is valid for 5 minutes only.
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td align="center"
                                                                style="color: #666666; font-size: 14px; line-height: 20px;">
                                                                If you didn't request this code, please ignore this
                                                                email.
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- END Content -->

                                        <!-- Footer -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                            bgcolor="#f8f9fa">
                                            <tr>
                                                <td style="padding: 20px 30px; text-align: center;">
                                                    <p
                                                        style="margin: 0; color: #999999; font-size: 12px; line-height: 18px;">
                                                        © {{ date('Y') }} {{ $appName }}. All rights reserved.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- END Footer -->
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>