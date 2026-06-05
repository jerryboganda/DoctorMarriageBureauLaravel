<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-size: 10px;
            line-height: 1.35;
        }

        .page {
            padding: 18px 20px 14px 20px;
        }

        .brand-row {
            width: 100%;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }

        .brand-left,
        .brand-right {
            vertical-align: top;
        }

        .brand-title {
            font-size: 9px;
            font-weight: 800;
            color: #e11d48;
            text-transform: uppercase;
            letter-spacing: 0.45em;
        }

        .page-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 4px 0 2px 0;
        }

        .page-subtitle {
            font-size: 11px;
            color: #64748b;
        }

        .id-pill {
            display: inline-block;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 12px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            margin-bottom: 10px;
            page-break-inside: avoid;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-photo {
            width: 92px;
            height: 112px;
            border-radius: 16px;
            border: 1px solid #cbd5e1;
            object-fit: cover;
            background: #334155;
        }

        .summary-name {
            font-size: 25px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.1;
            margin: 0;
        }

        .summary-label {
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.35em;
            color: #e11d48;
            margin-top: 2px;
        }

        .summary-badge {
            display: inline-block;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 9px;
            font-weight: 700;
            color: #475569;
        }

        .chip {
            display: inline-block;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            border-radius: 999px;
            padding: 4px 9px;
            font-size: 9px;
            font-weight: 600;
            color: #334155;
            margin: 0 5px 5px 0;
        }

        .chip b {
            color: #0f172a;
            font-weight: 700;
        }

        .columns {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .columns td {
            vertical-align: top;
        }

        .col-left {
            width: 49%;
            padding-right: 6px;
        }

        .col-right {
            width: 49%;
            padding-left: 6px;
        }

        .section {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 10px;
            margin-bottom: 8px;
            background: #ffffff;
            page-break-inside: avoid;
        }

        .section-accent {
            border-color: #fecdd3;
            background: #fff7f8;
        }

        .section-title {
            font-size: 9px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.15px;
            margin-bottom: 8px;
        }

        .section-title-accent {
            color: #be123c;
        }

        .section-title .icon {
            margin-right: 4px;
            font-size: 10px;
        }

        .about-box {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
            padding: 8px 10px;
            font-size: 9px;
            line-height: 1.45;
            color: #475569;
            font-style: italic;
        }

        .field-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .field-grid td {
            vertical-align: top;
            padding: 4px;
        }

        .field {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 10px;
            padding: 6px 8px;
        }

        .field-accent {
            border-color: #fecdd3;
            background: #ffffff;
        }

        .field-label {
            font-size: 6px;
            font-weight: 800;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 1px;
        }

        .field-label-accent {
            color: #e11d48;
        }

        .field-value {
            font-size: 9px;
            color: #0f172a;
            font-weight: 700;
            line-height: 1.25;
        }

        .field-value-accent {
            color: #881337;
        }

        .list-section-label {
            font-size: 7px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.35em;
            color: #94a3b8;
            margin: 1px 0 4px 0;
        }

        .list-item {
            border: 1px solid #dbeafe;
            background: #f8fbff;
            border-radius: 12px;
            padding: 7px 9px;
            margin-bottom: 5px;
        }

        .list-item-career {
            border-color: #bbf7d0;
            background: #f0fdf4;
        }

        .list-title {
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
        }

        .list-sub {
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-top: 1px;
        }

        .footer {
            border-top: 1px solid #e2e8f0;
            text-align: center;
            margin-top: 10px;
            padding-top: 8px;
        }

        .footer-brand {
            font-size: 9px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
        }

        .footer-wa {
            font-size: 9px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 1px;
        }

        .footer-legal {
            font-size: 7px;
            color: #94a3b8;
            margin-top: 3px;
        }
    </style>
</head>

<body>
    @php
        $member = $user->member;
        $education = $user->education ?? collect();
        $career = $user->career ?? collect();
        $family = $user->families;
        $address = $user->addresses->where('type', 'present')->first() ?? $user->addresses->first();
        $spiritual = $user->spiritual_backgrounds;
        $lifestyle = $user->lifestyles;
        $physical = $user->physical_attributes;
        $partner = $user->partner_expectations ?? null;

        $primaryEducation = $education->sortByDesc('end')->first();
        $primaryCareer = $career->sortByDesc('present')->sortByDesc('end')->first();

        $age = $member && $member->birthday ? date_diff(date_create($member->birthday), date_create('today'))->y : null;
        $religion = $spiritual?->religion?->name ?? 'N/A';
        $maritalStatus = $member?->marital_status?->name ?? 'N/A';
        $country = $address?->country?->name ?? 'N/A';
        $city = $address?->city?->name ?? 'N/A';
        $locationParts = array_filter([$city !== 'N/A' ? $city : null, $country !== 'N/A' ? $country : null]);
        $location = !empty($locationParts) ? implode(', ', $locationParts) : 'N/A';

        $profession = $primaryCareer?->designation ?? $member?->designation ?? 'N/A';
        $degree = $primaryEducation?->degree ?? $member?->education ?? 'N/A';

        $heightStr = \App\Support\BiodataFormatter::formatHeightForBiodata($physical?->height);
        $whatsapp = get_setting('biodata_whatsapp');

        $fmt = fn($v) => $v ? ucwords(str_replace('_', ' ', $v)) : 'N/A';
        $familySiblings = null;
        if ($family) {
            $brothers = (int) ($family->no_of_brothers ?? 0);
            $sisters = (int) ($family->no_of_sisters ?? 0);
            if ($brothers === 0 && $sisters === 0) {
                $familySiblings = 'None';
            } else {
                $parts = [];
                if ($brothers > 0) {
                    $parts[] = $brothers . ' Brother' . ($brothers > 1 ? 's' : '');
                }
                if ($sisters > 0) {
                    $parts[] = $sisters . ' Sister' . ($sisters > 1 ? 's' : '');
                }
                $familySiblings = implode(' & ', $parts);
            }
        }

        $partnerAge = $partner ? ($partner->min_age || $partner->max_age ? (($partner->min_age ?? 'Any') . ' - ' . ($partner->max_age ?? 'Any') . ' yrs') : null) : null;
    @endphp

    <div class="page">
        <table class="brand-row" cellspacing="0" cellpadding="0">
            <tr>
                <td class="brand-left">
                    <div class="brand-title">Doctor Marriage Bureau</div>
                    <div class="page-title">Biodata Profile</div>
                    <div class="page-subtitle">A premium matrimonial summary built from profile data.</div>
                </td>
                <td class="brand-right" align="right">
                    <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.35em; color: #94a3b8;">Profile ID</div>
                    <div class="id-pill">{{ $user->code ?? $user->id }}</div>
                </td>
            </tr>
        </table>

        <div class="summary-card">
            <table class="summary-table" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="width: 104px; vertical-align: top;">
                        @php($summaryPhoto = uploaded_asset($user->photo))
                        @if($summaryPhoto)
                            <img src="{{ $summaryPhoto }}" class="summary-photo">
                        @else
                            <div class="summary-photo"></div>
                        @endif
                    </td>
                    <td style="vertical-align: top; padding-left: 12px;">
                        <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="vertical-align: top;">
                                    <h2 class="summary-name">{{ $user->first_name }} {{ $user->last_name }}</h2>
                                    <div class="summary-label">Candidate Summary</div>
                                </td>
                                <td align="right" style="vertical-align: top;">
                                    <div class="summary-badge">{{ $gender = (($member->gender ?? 1) == 2 ? 'Female' : 'Male') }}</div>
                                </td>
                            </tr>
                        </table>

                        <div style="margin-top: 10px;">
                            <span class="chip"><b>{{ $age ? $age . ' yrs' : 'Age N/A' }}</b></span>
                            <span class="chip"><b>{{ $religion }}</b></span>
                            <span class="chip"><b>{{ $maritalStatus }}</b></span>
                            <span class="chip"><b>{{ $location }}</b></span>
                            <span class="chip"><b>{{ $profession }}</b></span>
                            <span class="chip"><b>{{ $degree }}</b></span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <table class="columns" cellspacing="0" cellpadding="0">
            <tr>
                <td class="col-left">
                    @if($member && $member->introduction)
                        <div class="section">
                            <div class="section-title"><span class="icon">&#9998;</span> About</div>
                            <div class="about-box">"{{ Str::limit($member->introduction, 240) }}"</div>
                        </div>
                    @endif

                    <div class="section">
                        <div class="section-title"><span class="icon">&#9734;</span> Basic Information</div>
                        <table class="field-grid" cellspacing="0" cellpadding="0">
                            <tr>
                                <td width="33.33%"><div class="field"><div class="field-label">Gender</div><div class="field-value">{{ $gender }}</div></div></td>
                                <td width="33.33%"><div class="field"><div class="field-label">Age</div><div class="field-value">{{ $age ? $age . ' Yrs' : 'N/A' }}</div></div></td>
                                <td width="33.33%"><div class="field"><div class="field-label">Marital Status</div><div class="field-value">{{ $maritalStatus }}</div></div></td>
                            </tr>
                            <tr>
                                <td><div class="field"><div class="field-label">Religion</div><div class="field-value">{{ $religion }}</div></div></td>
                                <td><div class="field"><div class="field-label">Caste</div><div class="field-value">{{ $spiritual?->caste?->name ?? 'N/A' }}</div></div></td>
                                <td><div class="field"><div class="field-label">Mother Tongue</div><div class="field-value">{{ $member?->mothereTongue?->name ?? 'N/A' }}</div></div></td>
                            </tr>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title"><span class="icon">&#127891;</span> Education & Career</div>
                        <div class="list-section-label">Education</div>
                        @if($education && $education->count() > 0)
                            @foreach($education->sortByDesc('end')->take(2) as $edu)
                                <div class="list-item">
                                    <div class="list-title">{{ data_get($edu, 'degree', 'N/A') }}</div>
                                    @if(data_get($edu, 'institution'))
                                        <div class="list-sub">{{ data_get($edu, 'institution') }}</div>
                                    @endif
                                </div>
                            @endforeach
                        @else
                            <div class="list-item"><div class="list-title">N/A</div></div>
                        @endif

                        <div class="list-section-label" style="margin-top: 8px;">Career</div>
                        @if($career && $career->count() > 0)
                            @foreach($career->sortByDesc('present')->sortByDesc('end')->take(2) as $job)
                                <div class="list-item list-item-career">
                                    <div class="list-title">{{ data_get($job, 'designation', 'N/A') }}</div>
                                    @if(data_get($job, 'company'))
                                        <div class="list-sub">{{ data_get($job, 'company') }}</div>
                                    @endif
                                </div>
                            @endforeach
                        @else
                            <div class="list-item list-item-career"><div class="list-title">N/A</div></div>
                        @endif
                    </div>

                    <div class="section">
                        <div class="section-title"><span class="icon">&#128106;</span> Family Information</div>
                        <table class="field-grid" cellspacing="0" cellpadding="0">
                            <tr>
                                <td width="50%"><div class="field"><div class="field-label">Father's Name</div><div class="field-value">{{ $family?->father_name ?? 'N/A' }}</div></div></td>
                                <td width="50%"><div class="field"><div class="field-label">Father's Occupation</div><div class="field-value">{{ $family?->father_occupation ?? 'N/A' }}</div></div></td>
                            </tr>
                            <tr>
                                <td><div class="field"><div class="field-label">Mother's Name</div><div class="field-value">{{ $family?->mother_name ?? 'N/A' }}</div></div></td>
                                <td><div class="field"><div class="field-label">Mother's Occupation</div><div class="field-value">{{ $family?->mother_occupation ?? 'N/A' }}</div></div></td>
                            </tr>
                            <tr>
                                <td><div class="field"><div class="field-label">Siblings</div><div class="field-value">{{ $familySiblings ?? 'N/A' }}</div></div></td>
                                <td><div class="field"><div class="field-label">Family Type</div><div class="field-value">{{ $fmt($family?->family_type ?? null) }}</div></div></td>
                            </tr>
                            <tr>
                                <td colspan="2"><div class="field"><div class="field-label">Family Values</div><div class="field-value">{{ $spiritual?->family_value?->name ?? 'N/A' }}</div></div></td>
                            </tr>
                        </table>
                    </div>
                </td>

                <td class="col-right">
                    <div class="section">
                        <div class="section-title"><span class="icon">&#9770;</span> Religious & Residence</div>
                        <table class="field-grid" cellspacing="0" cellpadding="0">
                            <tr>
                                <td width="50%"><div class="field"><div class="field-label">Religion</div><div class="field-value">{{ $religion }}</div></div></td>
                                <td width="50%"><div class="field"><div class="field-label">Caste</div><div class="field-value">{{ $caste ?? 'N/A' }}</div></div></td>
                            </tr>
                            <tr>
                                <td colspan="2"><div class="field"><div class="field-label">Sect / Ethnicity</div><div class="field-value">{{ $spiritual?->ethnicity ?? 'N/A' }}</div></div></td>
                            </tr>
                            <tr>
                                <td width="50%"><div class="field"><div class="field-label">Country</div><div class="field-value">{{ $country }}</div></div></td>
                                <td width="50%"><div class="field"><div class="field-label">City</div><div class="field-value">{{ $city }}</div></div></td>
                            </tr>
                            <tr>
                                <td colspan="2"><div class="field"><div class="field-label">Nationality</div><div class="field-value">{{ $member?->nationality ?? 'N/A' }}</div></div></td>
                            </tr>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title"><span class="icon">&#9889;</span> Physical & Lifestyle</div>
                        <table class="field-grid" cellspacing="0" cellpadding="0">
                            <tr>
                                <td width="33.33%"><div class="field"><div class="field-label">Height</div><div class="field-value">{!! $heightStr ?: 'N/A' !!}</div></div></td>
                                <td width="33.33%"><div class="field"><div class="field-label">Weight</div><div class="field-value">{{ data_get($physical, 'weight') ? data_get($physical, 'weight') . ' kg' : 'N/A' }}</div></div></td>
                                <td width="33.33%"><div class="field"><div class="field-label">Complexion</div><div class="field-value">{{ $fmt(data_get($physical, 'complexion')) }}</div></div></td>
                            </tr>
                            <tr>
                                <td><div class="field"><div class="field-label">Body Type</div><div class="field-value">{{ $fmt(data_get($physical, 'body_type')) }}</div></div></td>
                                <td><div class="field"><div class="field-label">Eye Color</div><div class="field-value">{{ $fmt(data_get($physical, 'eye_color')) }}</div></div></td>
                                <td><div class="field"><div class="field-label">Hair Color</div><div class="field-value">{{ $fmt(data_get($physical, 'hair_color')) }}</div></div></td>
                            </tr>
                            <tr>
                                <td><div class="field"><div class="field-label">Diet</div><div class="field-value">{{ $fmt(data_get($lifestyle, 'diet')) }}</div></div></td>
                                <td><div class="field"><div class="field-label">Living With</div><div class="field-value">{{ $fmt(data_get($lifestyle, 'living_with')) }}</div></div></td>
                                <td><div class="field"><div class="field-label">Smoke</div><div class="field-value">{{ data_get($lifestyle, 'smoke') && strtolower((string) data_get($lifestyle, 'smoke')) !== 'never' ? 'Smokes '.$fmt(data_get($lifestyle, 'smoke')) : $fmt(data_get($lifestyle, 'smoke')) }}</div></div></td>
                            </tr>
                            <tr>
                                <td><div class="field"><div class="field-label">Drink</div><div class="field-value">{{ data_get($lifestyle, 'drink') && strtolower((string) data_get($lifestyle, 'drink')) !== 'never' ? 'Drinks '.$fmt(data_get($lifestyle, 'drink')) : $fmt(data_get($lifestyle, 'drink')) }}</div></div></td>
                                <td><div class="field"><div class="field-label">Sleep Schedule</div><div class="field-value">{{ $fmt(data_get($lifestyle, 'sleep_schedule')) }}</div></div></td>
                                <td><div class="field"><div class="field-label">Property / House</div><div class="field-value">{{ $fmt(data_get($lifestyle, 'property')) }}</div></div></td>
                            </tr>
                        </table>
                    </div>

                    @if($partner)
                        <div class="section section-accent">
                            <div class="section-title section-title-accent"><span class="icon">&#10084;</span> Partner Expectations</div>
                            <table class="field-grid" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="33.33%"><div class="field field-accent"><div class="field-label field-label-accent">Age Range</div><div class="field-value field-value-accent">{{ $partnerAge ?? 'Any' }}</div></div></td>
                                    <td width="33.33%"><div class="field field-accent"><div class="field-label field-label-accent">Height</div><div class="field-value field-value-accent">{{ $partner?->height ?? 'Any' }}</div></div></td>
                                    <td width="33.33%"><div class="field field-accent"><div class="field-label field-label-accent">Religion</div><div class="field-value field-value-accent">{{ $partner?->religion?->name ?? 'Any' }}</div></div></td>
                                </tr>
                                <tr>
                                    <td><div class="field field-accent"><div class="field-label field-label-accent">Marital Status</div><div class="field-value field-value-accent">{{ optional(\App\Models\MaritalStatus::find($partner->marital_status_id))->name ?? 'Any' }}</div></div></td>
                                    <td><div class="field field-accent"><div class="field-label field-label-accent">Caste</div><div class="field-value field-value-accent">{{ optional(\App\Models\Caste::find($partner->caste_id))->name ?? 'Any' }}</div></div></td>
                                    <td><div class="field field-accent"><div class="field-label field-label-accent">Residence</div><div class="field-value field-value-accent">{{ optional(\App\Models\Country::find($partner->residence_country_id))->name ?? 'Any' }}</div></div></td>
                                </tr>
                                <tr>
                                    <td><div class="field field-accent"><div class="field-label field-label-accent">Education</div><div class="field-value field-value-accent">{{ $partner?->education ?? 'Any' }}</div></div></td>
                                    <td><div class="field field-accent"><div class="field-label field-label-accent">Language</div><div class="field-value field-value-accent">{{ $partner?->member_language?->name ?? 'Any' }}</div></div></td>
                                    <td><div class="field field-accent"><div class="field-label field-label-accent">Family Values</div><div class="field-value field-value-accent">{{ $partner?->family_value?->name ?? 'Any' }}</div></div></td>
                                </tr>
                            </table>
                            @if($partner->general)
                                <div style="margin-top: 8px; border-top: 1px solid #fecdd3; padding-top: 6px;">
                                    <div class="field-label field-label-accent">Ideal Partner</div>
                                    <div class="field-value field-value-accent" style="font-style: italic; font-size: 9px; font-weight: 500;">
                                        "{{ Str::limit($partner->general, 180) }}"
                                    </div>
                                </div>
                            @endif
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        <div class="footer">
            <div class="footer-brand">Doctor Marriage Bureau</div>
            @if($whatsapp)
                <div class="footer-wa">WhatsApp: {{ $whatsapp }}</div>
            @endif
            <div class="footer-legal">
                This document is confidential. Please respect privacy and do not distribute without permission.
            </div>
        </div>
    </div>
</body>

</html>
