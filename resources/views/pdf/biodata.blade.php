<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #e11d48; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
        .header p { color: #666; margin: 5px 0 0; }
        .section { margin-bottom: 25px; }
        .section-title { background: #f8fafc; padding: 8px 15px; border-left: 4px solid #e11d48; font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 14px; margin-bottom: 15px; }
        .grid { width: 100%; border-collapse: collapse; }
        .grid td { padding: 8px 0; vertical-align: top; font-size: 13px; }
        .label { color: #64748b; font-weight: bold; width: 35%; }
        .value { color: #0f172a; width: 65%; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        .photo-box { float: right; width: 150px; height: 180px; border: 1px solid #e2e8f0; padding: 5px; margin-left: 20px; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .clearfix::after { content: ""; clear: both; display: table; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Marriage Biodata</h1>
        <p>Profile ID: DMB-{{ $user->id }}-{{ date('Y') }}</p>
    </div>

    <div class="clearfix">
        @if($user->photo)
            <div class="photo-box">
                <img src="{{ public_path($user->photo) }}" alt="Profile Photo">
            </div>
        @endif

        <div class="section">
            <div class="section-title">Personal Information</div>
            <table class="grid">
                <tr>
                    <td class="label">Full Name</td>
                    <td class="value">{{ $user->first_name }} {{ $user->last_name }}</td>
                </tr>
                <tr>
                    <td class="label">Gender</td>
                    <td class="value">{{ $user->member->gender ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Date of Birth</td>
                    <td class="value">{{ $user->member->birthday ? date('d M Y', strtotime($user->member->birthday)) : 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Marital Status</td>
                    <td class="value">{{ $user->member->marital_status->name ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Religion / Sect</td>
                    <td class="value">
                        {{ $user->spiritual_background->religion->name ?? 'N/A' }} 
                        @if(!empty($user->spiritual_background->ethnicity))
                            ({{ $user->spiritual_background->ethnicity }})
                        @endif
                    </td>
                </tr>
                <tr>
                    <td class="label">Height</td>
                    <td class="value">
                        @if($user->physical_attributes && $user->physical_attributes->height)
                            {{ floor($user->physical_attributes->height / 30.48) }}' {{ round(($user->physical_attributes->height % 30.48) / 2.54) }}"
                        @else
                            N/A
                        @endif
                    </td>
                </tr>
                <tr>
                    <td class="label">Mother Tongue</td>
                    <td class="value">{{ $user->member->mothereTongue->name ?? 'N/A' }}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Professional Background</div>
        <table class="grid">
            <tr>
                <td class="label">Education</td>
                <td class="value">{{ $user->education->degree ?? $user->member->education ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Profession</td>
                <td class="value">{{ $user->career->designation ?? $user->member->designation ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Organization</td>
                <td class="value">{{ $user->career->company ?? $user->member->company ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Residency Details</div>
        <table class="grid">
            <tr>
                <td class="label">Current Location</td>
                <td class="value">
                    {{ $user->address->city->name ?? '' }}, {{ $user->address->country->name ?? 'N/A' }}
                </td>
            </tr>
            <tr>
                <td class="label">Nationality</td>
                <td class="value">{{ $user->residency->nationality->name ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    @if($user->family)
    <div class="section">
        <div class="section-title">Family Information</div>
        <table class="grid">
            <tr>
                <td class="label">Father's Name</td>
                <td class="value">{{ $user->family->father_name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Father's Profession</td>
                <td class="value">{{ $user->family->father_profession ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Mother's Name</td>
                <td class="value">{{ $user->family->mother_name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Siblings</td>
                <td class="value">{{ $user->family->sibling_details ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>
    @endif

    <div class="footer">
        Generated via Digital Marriage Bureau. All rights reserved.
    </div>
</body>
</html>