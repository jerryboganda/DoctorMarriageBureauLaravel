<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #334155;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .header {
            background-color: #0f172a;
            padding: 12px 18px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .avatar {
            width: 70px;
            height: 70px;
            border-radius: 8px;
            border: 2px solid #ffffff;
            background-color: #e2e8f0;
        }

        .name {
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            margin: 0 0 2px 0;
        }

        .quick-info {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 3px;
            line-height: 1.5;
        }

        .highlight {
            color: #f8fafc;
            font-weight: bold;
        }

        .content {
            padding: 10px 18px 5px 18px;
        }

        .section {
            margin-bottom: 6px;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 3px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
        }

        .card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 2px;
            width: 100%;
        }

        .grid-table {
            width: 100%;
            border-collapse: collapse;
        }

        .grid-table td {
            padding: 3px 5px;
            vertical-align: top;
        }

        .item-label {
            font-size: 7px;
            font-weight: bold;
            color: #e11d48;
            text-transform: uppercase;
            margin-bottom: 1px;
            display: block;
        }

        .item-value {
            font-size: 10px;
            color: #0f172a;
            font-weight: 500;
            display: block;
        }

        .partner-card {
            background-color: #fff1f2;
            border: 1px solid #fecdd3;
        }
        .partner-label { color: #be123c; }
        .partner-value { color: #881337; }

        .about-text {
            font-size: 9px;
            color: #475569;
            line-height: 1.4;
        }

        .footer {
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
        }

        .logo-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
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
        $partner = $user->partner_expectations;

        $primaryEducation = $education->sortByDesc('end')->first();
        $primaryCareer = $career->sortByDesc('present')->sortByDesc('end')->first();

        $age = $member && $member->birthday ? date_diff(date_create($member->birthday), date_create('today'))->y : null;
        $religion = $spiritual->religion->name ?? 'N/A';
        $marital_status = $member->marital_status->name ?? 'N/A';

        $locationParts = array_filter([$address->city->name ?? null, $address->country->name ?? null]);
        $location = !empty($locationParts) ? implode(', ', $locationParts) : 'N/A';

        $profession = $primaryCareer->designation ?? $member->designation ?? 'N/A';
        $degree = $primaryEducation->degree ?? $member->education ?? 'N/A';

        $heightStr = \App\Support\BiodataFormatter::formatHeightForBiodata($physical?->height);
        $whatsapp = get_setting('biodata_whatsapp');
    @endphp

    {{-- Dual Logo Bar --}}
    <table class="logo-bar">
        <tr>
            <td style="width: 50%; text-align: left; padding: 6px 18px;">
                @if(file_exists(public_path('assets/img/logo.png')))
                    <img src="{{ public_path('assets/img/logo.png') }}" style="height: 30px; width: auto;" alt="Doctor Marriage Bureau">
                @else
                    <span style="font-size: 12px; font-weight: bold; color: #0f172a;">Doctor Marriage Bureau</span>
                @endif
            </td>
            <td style="width: 50%; text-align: right; padding: 6px 18px;">
                @if(file_exists(public_path('assets/img/sponsor-logo.png')))
                    <img src="{{ public_path('assets/img/sponsor-logo.png') }}" style="height: 30px; width: auto;" alt="Sponsor">
                @endif
            </td>
        </tr>
    </table>

    {{-- Header Banner --}}
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 80px;">
                    @if($user->photo)
                        <img src="{{ public_path($user->photo) }}" class="avatar">
                    @else
                        <div class="avatar"></div>
                    @endif
                </td>
                <td style="vertical-align: middle; padding-left: 10px;">
                    <h1 class="name">{{ $user->first_name }} {{ $user->last_name }}</h1>
                    <div style="font-size: 9px; color: #fda4af; font-weight: bold; margin-bottom: 3px;">
                        PROFILE ID: {{ $user->code ?? $user->id }}
                    </div>
                    <div class="quick-info">
                        Age: <span class="highlight">{{ $age ? $age . ' yrs' : 'N/A' }}</span> &nbsp;|&nbsp;
                        Religion: <span class="highlight">{{ $religion }}</span> &nbsp;|&nbsp;
                        Status: <span class="highlight">{{ $marital_status }}</span> &nbsp;|&nbsp;
                        Location: <span class="highlight">{{ $location }}</span> &nbsp;|&nbsp;
                        Profession: <span class="highlight">{{ $profession }}</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content">

        {{-- About Intro --}}
        @if($member && $member->introduction)
            <div class="section">
                <div class="section-title">About</div>
                <div class="about-text">{{ Str::limit($member->introduction, 200) }}</div>
            </div>
        @endif

        {{-- Basic Info + Physical Attributes side by side --}}
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Basic Information</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="33%"><span class="item-label">Gender</span><span class="item-value">{{ ($member->gender ?? 1) == 2 ? 'Female' : 'Male' }}</span></td>
                                    <td width="33%"><span class="item-label">Age</span><span class="item-value">{{ $age ? $age . ' Yrs' : 'N/A' }}</span></td>
                                    <td width="33%"><span class="item-label">Marital Status</span><span class="item-value">{{ $marital_status }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="item-label">Religion</span><span class="item-value">{{ $religion }}</span></td>
                                    <td><span class="item-label">Caste</span><span class="item-value">{{ $spiritual->caste->name ?? 'N/A' }}</span></td>
                                    <td><span class="item-label">Mother Tongue</span><span class="item-value">{{ $member->mothereTongue->name ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td style="width: 4%;"></td>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Physical Attributes</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="33%"><span class="item-label">Height</span><span class="item-value">{{ $heightStr ?: 'N/A' }}</span></td>
                                    <td width="33%"><span class="item-label">Weight</span><span class="item-value">{{ $physical->weight ? $physical->weight . ' kg' : 'N/A' }}</span></td>
                                    <td width="33%"><span class="item-label">Complexion</span><span class="item-value">{{ $physical->complexion ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="item-label">Body Type</span><span class="item-value">{{ $physical->body_type ?? 'N/A' }}</span></td>
                                    <td><span class="item-label">Eye Color</span><span class="item-value">{{ $physical->eye_color ?? 'N/A' }}</span></td>
                                    <td><span class="item-label">Hair Color</span><span class="item-value">{{ $physical->hair_color ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        {{-- Education + Career side by side --}}
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Education</div>
                        @if($education && $education->count() > 0)
                            @foreach($education->sortByDesc('end')->take(2) as $edu)
                            <div class="card" style="margin-bottom: 3px;">
                                <table class="grid-table"><tr><td>
                                    <span style="font-size: 10px; font-weight: bold; color: #0f172a;">{{ $edu->degree }}</span>
                                    @if($edu->institution)<br><span style="font-size: 8px; color: #64748b;">{{ $edu->institution }}</span>@endif
                                </td></tr></table>
                            </div>
                            @endforeach
                        @else
                            <div class="card"><table class="grid-table"><tr><td><span class="item-value">N/A</span></td></tr></table></div>
                        @endif
                    </div>
                </td>
                <td style="width: 4%;"></td>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Career</div>
                        @if($career && $career->count() > 0)
                            @foreach($career->sortByDesc('present')->sortByDesc('end')->take(2) as $job)
                            <div class="card" style="margin-bottom: 3px;">
                                <table class="grid-table"><tr><td>
                                    <span style="font-size: 10px; font-weight: bold; color: #0f172a;">{{ $job->designation }}</span>
                                    @if($job->company)<br><span style="font-size: 8px; color: #64748b;">{{ $job->company }}</span>@endif
                                </td></tr></table>
                            </div>
                            @endforeach
                        @else
                            <div class="card"><table class="grid-table"><tr><td><span class="item-value">N/A</span></td></tr></table></div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        {{-- Religious + Residence side by side --}}
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Religious Data</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="50%"><span class="item-label">Religion</span><span class="item-value">{{ $religion }}</span></td>
                                    <td width="50%"><span class="item-label">Caste</span><span class="item-value">{{ $spiritual->caste->name ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td colspan="2"><span class="item-label">Sect / Ethnicity</span><span class="item-value">{{ $spiritual->ethnicity ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td style="width: 4%;"></td>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Residence</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="50%"><span class="item-label">Country</span><span class="item-value">{{ $address->country->name ?? 'N/A' }}</span></td>
                                    <td width="50%"><span class="item-label">City</span><span class="item-value">{{ $address->city->name ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td colspan="2"><span class="item-label">Nationality</span><span class="item-value">{{ $member->nationality ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        {{-- Family + Lifestyle side by side --}}
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Family Information</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="50%"><span class="item-label">Father's Name</span><span class="item-value">{{ $family->father_name ?? 'N/A' }}</span></td>
                                    <td width="50%"><span class="item-label">Father's Occupation</span><span class="item-value">{{ $family->father_occupation ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="item-label">Mother's Name</span><span class="item-value">{{ $family->mother_name ?? 'N/A' }}</span></td>
                                    <td><span class="item-label">Mother's Occupation</span><span class="item-value">{{ $family->mother_occupation ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="item-label">Siblings</span><span class="item-value">@if($family){{ $family->no_of_brothers > 0 ? $family->no_of_brothers . ' Bro' : '' }}{{ $family->no_of_brothers > 0 && $family->no_of_sisters > 0 ? ' & ' : '' }}{{ $family->no_of_sisters > 0 ? $family->no_of_sisters . ' Sis' : '' }}{{ $family->no_of_brothers == 0 && $family->no_of_sisters == 0 ? 'None' : '' }}@else N/A @endif</span></td>
                                    <td><span class="item-label">Family Type</span><span class="item-value">{{ $family->family_type ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td style="width: 4%;"></td>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Lifestyle</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="50%"><span class="item-label">Diet</span><span class="item-value">{{ $lifestyle->diet ?? 'N/A' }}</span></td>
                                    <td width="50%"><span class="item-label">Living With</span><span class="item-value">{{ $lifestyle->living_with ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="item-label">Smoke</span><span class="item-value">{{ $lifestyle->smoke ?? 'N/A' }}</span></td>
                                    <td><span class="item-label">Drink</span><span class="item-value">{{ $lifestyle->drink ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="item-label">Sleep Schedule</span><span class="item-value">{{ $lifestyle->sleep_schedule ?? 'N/A' }}</span></td>
                                    <td><span class="item-label">Property / House</span><span class="item-value">{{ $lifestyle->property ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        {{-- Hobbies (compact, single row) --}}
        @php $userHobby = $user->hobbies ?? null; @endphp
        @if($userHobby && ($userHobby->hobbies || $userHobby->interests))
        <div class="section">
            <div class="section-title">Hobbies & Interests</div>
            <div class="card">
                <table class="grid-table">
                    <tr>
                        <td width="50%"><span class="item-label">Hobbies</span><span class="item-value">{{ $userHobby->hobbies ?? 'N/A' }}</span></td>
                        <td width="50%"><span class="item-label">Interests</span><span class="item-value">{{ $userHobby->interests ?? 'N/A' }}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        @endif

        {{-- Partner Expectations --}}
        @if($partner)
        <div class="section">
            <div class="section-title" style="color: #e11d48; border-color: #fecdd3;">Partner Expectations</div>
            <div class="card partner-card">
                <table class="grid-table">
                    <tr>
                        <td width="33%"><span class="item-label partner-label">Age Range</span><span class="item-value partner-value">{{ $partner->min_age ?? 'Any' }} - {{ $partner->max_age ?? 'Any' }} yrs</span></td>
                        <td width="33%"><span class="item-label partner-label">Height Range</span><span class="item-value partner-value">{{ $partner->height ?? 'Any' }} - {{ $partner->height_max ?? 'Any' }}</span></td>
                        <td width="33%"><span class="item-label partner-label">Religion</span><span class="item-value partner-value">{{ $partner->religion->name ?? 'Any' }}</span></td>
                    </tr>
                    <tr>
                        <td><span class="item-label partner-label">Marital Status</span><span class="item-value partner-value">{{ optional(\App\Models\MaritalStatus::find($partner->marital_status_id))->name ?? 'Any' }}</span></td>
                        <td><span class="item-label partner-label">Caste</span><span class="item-value partner-value">{{ optional(\App\Models\Caste::find($partner->caste_id))->name ?? 'Any' }}</span></td>
                        <td><span class="item-label partner-label">Residence</span><span class="item-value partner-value">{{ optional(\App\Models\Country::find($partner->residence_country_id))->name ?? 'Any' }}</span></td>
                    </tr>
                    <tr>
                        <td><span class="item-label partner-label">Education</span><span class="item-value partner-value">{{ $partner->education ?? 'Any' }}</span></td>
                        <td><span class="item-label partner-label">Language</span><span class="item-value partner-value">{{ $partner->member_language->name ?? 'Any' }}</span></td>
                        <td><span class="item-label partner-label">Family Values</span><span class="item-value partner-value">{{ $partner->family_value->name ?? 'Any' }}</span></td>
                    </tr>
                    @if($partner->general)
                    <tr>
                        <td colspan="3" style="padding-top: 4px;">
                            <span class="item-label partner-label">Describe Your Ideal Partner</span>
                            <span class="item-value partner-value" style="font-style: italic; font-size: 9px; line-height: 1.4;">"{{ Str::limit($partner->general, 200) }}"</span>
                        </td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>
        @endif

        {{-- Footer --}}
        <div class="footer">
            <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 3px;">
                Doctor Marriage Bureau
            </div>
            @if($whatsapp)
                <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 3px;">
                    WhatsApp: {{ $whatsapp }}
                </div>
            @endif
            <div style="font-size: 7px; color: #94a3b8;">
                This document is confidential. Please respect privacy and do not distribute without permission.
            </div>
        </div>
    </div>
</body>

</html>
