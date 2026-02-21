<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            color: #422006;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            background-color: #fffbeb;
        }

        .border-frame {
            border: 2px solid #b45309;
            padding: 20px;
            height: 95%;
            position: relative;
        }

        .corner {
            width: 30px;
            height: 30px;
            position: absolute;
            border-color: #b45309;
            border-style: solid;
        }

        .top-left {
            top: -2px;
            left: -2px;
            border-width: 4px 0 0 4px;
        }

        .top-right {
            top: -2px;
            right: -2px;
            border-width: 4px 4px 0 0;
        }

        .bottom-left {
            bottom: -2px;
            left: -2px;
            border-width: 0 0 4px 4px;
        }

        .bottom-right {
            bottom: -2px;
            right: -2px;
            border-width: 0 4px 4px 0;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #fcd34d;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header img {
            height: 60px;
            margin-bottom: 10px;
        }

        .header h1 {
            color: #92400e;
            margin: 5px 0;
            font-size: 32px;
            font-weight: normal;
            letter-spacing: 2px;
        }

        .slogan {
            color: #b45309;
            font-style: italic;
            font-size: 12px;
        }

        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .main-table td {
            padding: 8px 15px;
            border-bottom: 1px solid #e7e5e4;
            vertical-align: top;
        }

        .main-table tr:last-child td {
            border-bottom: none;
        }

        .section-title {
            background-color: #fff7ed;
            color: #9a3412;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            border-top: 2px solid #fed7aa;
            border-bottom: 2px solid #fed7aa;
            margin: 20px 0 10px 0;
            font-size: 14px;
        }

        .label {
            width: 40%;
            font-weight: bold;
            color: #78350f;
        }

        .value {
            width: 60%;
            color: #431407;
        }

        .photo-container {
            text-align: center;
            margin-bottom: 30px;
        }

        .photo-frame {
            padding: 5px;
            border: 2px solid #d97706;
            display: inline-block;
            background: white;
        }

        .photo-frame img {
            height: 160px;
            width: 140px;
            object-fit: cover;
        }

        .om-symbol {
            text-align: center;
            font-size: 24px;
            color: #d97706;
            margin-bottom: 10px;
        }
    </style>
</head>

<body>
    @php
        $education = $user->education->sortByDesc('end')->first();
        $career = $user->career->sortByDesc('end')->first();
        $family = $user->families;
        $address = $user->addresses->where('type', 'present')->first() ?? $user->addresses->first();
        $spiritual = $user->spiritual_backgrounds;
        $physical = $user->physical_attributes;
        $member = $user->member;
        $astrology = $user->astrologies;
        $logo = get_setting('header_logo');
    @endphp

    <div class="border-frame">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <div class="header">
            <div class="om-symbol">|| Shree Ganeshaya Namah ||</div>
            @if($logo != null)
                <img src="{{ uploaded_asset($logo) }}">
            @else
                <!-- No default logo fallback to verify branding -->
                <h2 style="color: #9a3412; font-family: serif;">Doctor Marriage Bureau</h2>
            @endif
            <h1>Marriage Biodata</h1>
            <div class="slogan">Trusted Matrimony Services</div>
        </div>

        <div class="photo-container">
            @if($user->photo)
                <div class="photo-frame">
                    <img src="{{ public_path($user->photo) }}">
                </div>
            @endif
            <h2 style="color: #92400e; margin: 10px 0 5px 0;">{{ $user->first_name }} {{ $user->last_name }}</h2>
            <div style="color: #b45309;">Profile ID: {{ $user->id }}</div>
        </div>

        <div class="section-title">Personal Details</div>
        <table class="main-table">
            <tr>
                <td class="label">Date of Birth</td>
                <td class="value">{{ $member->birthday ? date('d F Y', strtotime($member->birthday)) : '-' }}</td>
            </tr>
            <tr>
                <td class="label">Height</td>
                <td class="value">
                    @if($physical && $physical->height)
                        {{ floor($physical->height / 30.48) }}ft {{ round(($physical->height % 30.48) / 2.54) }}in
                    @else - @endif
                </td>
            </tr>
            <tr>
                <td class="label">Complexion</td>
                <td class="value">{{ $physical->complexion ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Education</td>
                <td class="value">{{ $education->degree ?? $member->education ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Occupation</td>
                <td class="value">{{ $career->designation ?? $member->designation ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Annual Income</td>
                <td class="value">{{ $member->annual_salary_range->name ?? '-' }}</td>
            </tr>
        </table>

        <div class="section-title">Religious & Social Details</div>
        <table class="main-table">
            <tr>
                <td class="label">Religion / Caste</td>
                <td class="value">{{ $spiritual->religion->name ?? '-' }} / {{ $spiritual->caste->name ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Gothra / Ethinicity</td>
                <td class="value">{{ $spiritual->ethnicity ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Manglik Status</td>
                <td class="value">{{ $spiritual->manglik ?? 'Not Specified' }}</td>
            </tr>
            <tr>
                <td class="label">Horoscope/Sun Sign</td>
                <td class="value">{{ $astrology->sun_sign ?? '-' }}</td>
            </tr>
        </table>

        <div class="section-title">Family Details</div>
        <table class="main-table">
            <tr>
                <td class="label">Father</td>
                <td class="value">{{ $family->father_name ?? '-' }} ({{ $family->father_profession ?? '' }})</td>
            </tr>
            <tr>
                <td class="label">Mother</td>
                <td class="value">{{ $family->mother_name ?? '-' }} ({{ $family->mother_profession ?? '' }})</td>
            </tr>
            <tr>
                <td class="label">Siblings</td>
                <td class="value">{{ $family->sibling_details ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Family Location</td>
                <td class="value">{{ $family->location_city ?? '' }} {{ $family->location_country ?? '' }}</td>
            </tr>
        </table>

        <div class="section-title">Contact Information</div>
        <table class="main-table">
            <tr>
                <td class="label">Contact Person</td>
                <td class="value">{{ $family->contact_person ?? 'Guardian' }}</td>
            </tr>
            <tr>
                <td class="label">Residence</td>
                <td class="value">{{ $address->city->name ?? '' }}, {{ $address->country->name ?? '' }}</td>
            </tr>
        </table>

    </div>
</body>

</html>