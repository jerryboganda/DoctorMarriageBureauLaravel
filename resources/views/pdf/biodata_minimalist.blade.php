<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            color: #111;
            line-height: 1.6;
            padding: 40px;
            margin: 0;
        }

        .header {
            margin-bottom: 50px;
        }

        .name {
            font-size: 36px;
            font-weight: 300;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #111;
            padding-bottom: 5px;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }

        .grid-table {
            width: 100%;
            border-collapse: collapse;
        }

        .grid-table td {
            padding: 6px 0;
            vertical-align: top;
            width: 50%;
            font-size: 13px;
        }

        .label {
            color: #666;
            font-size: 11px;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
        }

        .value {
            color: #111;
            font-weight: 500;
        }

        .about-text {
            font-size: 14px;
            color: #333;
        }

        .logo-small {
            position: absolute;
            top: 40px;
            right: 40px;
            width: 40px;
            opacity: 0.8;
        }

        .footer {
            position: fixed;
            bottom: 40px;
            left: 40px;
            font-size: 9px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
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
        $lifestyle = $user->lifestyles;
        $physical = $user->physical_attributes;
        $member = $user->member;
        $logo = get_setting('header_logo');
    @endphp

    @if($logo != null)
        <img src="{{ uploaded_asset($logo) }}" class="logo-small">
    @else
        <!-- No logo displayed if default -->
    @endif

    <div class="header">
        <h1 class="name">{{ $user->first_name }} {{ $user->last_name }}</h1>
        <div class="subtitle">Marriage Biodata • ID: {{ $user->id }}</div>
    </div>

    <div class="section">
        <div class="section-title">Introduction</div>
        <div class="about-text">
            {{ $member->introduction ?? 'I am looking for a suitable partner who shares my values.' }}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Personal</div>
        <table class="grid-table">
            <tr>
                <td><span class="label">Date of Birth</span><span
                        class="value">{{ $member->birthday ? date('d M Y', strtotime($member->birthday)) : '-' }}</span>
                </td>
                <td><span class="label">Marital Status</span><span
                        class="value">{{ $member->marital_status->name ?? '-' }}</span></td>
            </tr>
            <tr>
                <td><span class="label">Height</span><span class="value">
                        @if($physical && $physical->height)
                            {{ floor($physical->height / 30.48) }}' {{ round(($physical->height % 30.48) / 2.54) }}"
                        @else - @endif
                    </span></td>
                <td><span class="label">Diet</span><span class="value">{{ $lifestyle->diet ?? '-' }}</span></td>
            </tr>
            <tr>
                <td><span class="label">Religion</span><span
                        class="value">{{ $spiritual->religion->name ?? '-' }}</span></td>
                <td><span class="label">Location</span><span class="value">{{ $address->city->name ?? '' }},
                        {{ $address->country->name ?? '' }}</span></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Education & Career</div>
        <table class="grid-table">
            <tr>
                <td><span class="label">Education</span><span
                        class="value">{{ $education->degree ?? $member->education ?? '-' }}</span></td>
                <td><span class="label">Income</span><span
                        class="value">{{ $member->annual_salary_range->name ?? '-' }}</span></td>
            </tr>
            <tr>
                <td colspan="2"><span class="label">Occupation</span><span
                        class="value">{{ $career->designation ?? $member->designation ?? '-' }} at
                        {{ $career->company ?? $member->company ?? '-' }}</span></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Family</div>
        <table class="grid-table">
            <tr>
                <td><span class="label">Father</span><span class="value">{{ $family->father_name ?? '-' }}</span></td>
                <td><span class="label">Mother</span><span class="value">{{ $family->mother_name ?? '-' }}</span></td>
            </tr>
            <tr>
                <td colspan="2"><span class="label">Description</span><span class="value">
                        Family values are {{ $spiritual->family_value->name ?? 'important' }}.
                        {{ $family->family_type ?? '' }} family based in {{ $family->location_city ?? '' }}.
                    </span></td>
            </tr>
        </table>
    </div>

    <div class="footer">
        Generated by Doctor Marriage Bureau
    </div>
</body>

</html>