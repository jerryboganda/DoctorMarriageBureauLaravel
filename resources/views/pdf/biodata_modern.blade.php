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
            padding: 30px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 10px;
            border: 3px solid #ffffff;
            background-color: #e2e8f0;
        }

        .name {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            margin: 0 0 5px 0;
        }

        .quick-info {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 5px;
            line-height: 1.6;
        }

        .highlight {
            color: #f8fafc;
            font-weight: bold;
        }

        .content {
            padding: 30px;
        }

        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 8px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }

        .card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            width: 100%;
        }

        .grid-table {
            width: 100%;
            border-collapse: collapse;
        }

        .grid-table td {
            padding: 8px;
            vertical-align: top;
        }

        .item-label {
            font-size: 9px;
            font-weight: bold;
            color: #e11d48;
            text-transform: uppercase;
            margin-bottom: 2px;
            display: block;
        }

        .item-value {
            font-size: 13px;
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
            font-size: 12px;
            color: #475569;
            line-height: 1.6;
        }

        .footer {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
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
    @endphp

    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 120px;">
                    @if($user->photo)
                        <img src="{{ public_path($user->photo) }}" class="avatar">
                    @else
                        <div class="avatar"></div>
                    @endif
                </td>
                <td style="vertical-align: middle;">
                    <h1 class="name">{{ $user->first_name }} {{ $user->last_name }}</h1>
                    <div style="font-size: 11px; color: #fda4af; font-weight: bold; margin-bottom: 5px;">
                        PROFILE ID: {{ $user->id }}
                    </div>
                    <div class="quick-info">
                        Age: <span class="highlight">{{ $age ? $age . ' yrs' : 'N/A' }}</span> &nbsp;|&nbsp; 
                        Religion: <span class="highlight">{{ $religion }}</span> &nbsp;|&nbsp; 
                        Status: <span class="highlight">{{ $marital_status }}</span>
                        <br>
                        Location: <span class="highlight">{{ $location }}</span> &nbsp;|&nbsp; 
                        Profession: <span class="highlight">{{ $profession }}</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content">

        <!-- About Intro -->
        @if($member && $member->introduction)
            <div class="section">
                <div class="section-title">About</div>
                <div class="about-text">
                    {{ $member->introduction }}
                </div>
            </div>
        @endif

        <!-- Basic Info -->
        <div class="section">
            <div class="section-title">Basic Information</div>
            <div class="card">
                <table class="grid-table">
                    <tr>
                        <td width="33%">
                            <span class="item-label">Gender</span>
                            <span class="item-value">{{ ($member->gender ?? 1) == 2 ? 'Female' : 'Male' }}</span>
                        </td>
                        <td width="33%">
                            <span class="item-label">Age</span>
                            <span class="item-value">{{ $age ? $age . ' Years' : 'N/A' }}</span>
                        </td>
                        <td width="33%">
                            <span class="item-label">Religion</span>
                            <span class="item-value">{{ $religion }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="item-label">Caste</span>
                            <span class="item-value">{{ $spiritual->caste->name ?? 'N/A' }}</span>
                        </td>
                        <td>
                            <span class="item-label">Marital Status</span>
                            <span class="item-value">{{ $marital_status }}</span>
                        </td>
                        <td>
                            <span class="item-label">Mother Tongue</span>
                            <span class="item-value">{{ $member->mothereTongue->name ?? 'N/A' }}</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Education -->
        @if($education && $education->count() > 0)
        <div class="section">
            <div class="section-title">Education</div>
            @foreach($education->sortByDesc('end') as $edu)
            <div class="card" style="margin-bottom: 5px;">
                <div style="font-size: 13px; font-weight: bold; color: #0f172a;">{{ $edu->degree }}</div>
                @if($edu->institution)
                    <div style="font-size: 11px; color: #64748b;">{{ $edu->institution }}</div>
                @endif
                @if($edu->start)
                    <div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">
                        {{ $edu->start }} {{ $edu->end ? '- ' . $edu->end : '' }}
                    </div>
                @endif
            </div>
            @endforeach
        </div>
        @endif

        <!-- Career -->
        @if($career && $career->count() > 0)
        <div class="section">
            <div class="section-title">Career</div>
            @foreach($career->sortByDesc('present')->sortByDesc('end') as $job)
            <div class="card" style="margin-bottom: 5px;">
                <div style="font-size: 13px; font-weight: bold; color: #0f172a;">{{ $job->designation }}</div>
                @if($job->company)
                    <div style="font-size: 11px; color: #64748b;">{{ $job->company }}</div>
                @endif
                @if($job->start)
                    <div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">
                        {{ $job->start }} - {{ $job->present ? 'Present' : $job->end }}
                    </div>
                @endif
            </div>
            @endforeach
        </div>
        @endif

        <!-- Physical Attributes -->
        <div class="section">
            <div class="section-title">Height, Weight & Looks</div>
            <div class="card">
                <table class="grid-table">
                    <tr>
                        <td width="33%">
                            <span class="item-label">Height</span>
                            <span class="item-value">{{ $heightStr ?: 'N/A' }}</span>
                        </td>
                        <td width="33%">
                            <span class="item-label">Weight</span>
                            <span class="item-value">{{ $physical->weight ? $physical->weight . ' kg' : 'N/A' }}</span>
                        </td>
                        <td width="33%">
                            <span class="item-label">Complexion</span>
                            <span class="item-value">{{ $physical->complexion ?? 'N/A' }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="item-label">Body Type</span>
                            <span class="item-value">{{ $physical->body_type ?? 'N/A' }}</span>
                        </td>
                        <td>
                            <span class="item-label">Eye Color</span>
                            <span class="item-value">{{ $physical->eye_color ?? 'N/A' }}</span>
                        </td>
                        <td>
                            <span class="item-label">Hair Color</span>
                            <span class="item-value">{{ $physical->hair_color ?? 'N/A' }}</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- 2 Column Layout using Table for mPDF -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" page-break-inside="avoid">
            <tr>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Religious Data</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="50%">
                                        <span class="item-label">Religion</span>
                                        <span class="item-value">{{ $religion }}</span>
                                    </td>
                                    <td width="50%">
                                        <span class="item-label">Caste</span>
                                        <span class="item-value">{{ $spiritual->caste->name ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        <span class="item-label">Sect / Ethnicity</span>
                                        <span class="item-value">{{ $spiritual->ethnicity ?? 'N/A' }}</span>
                                    </td>
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
                                    <td width="50%">
                                        <span class="item-label">Country</span>
                                        <span class="item-value">{{ $address->country->name ?? 'N/A' }}</span>
                                    </td>
                                    <td width="50%">
                                        <span class="item-label">City</span>
                                        <span class="item-value">{{ $address->city->name ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        <span class="item-label">Nationality</span>
                                        <span class="item-value">{{ $member->nationality ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Family Information -->
        <div class="section">
            <div class="section-title">Family Information</div>
            <div class="card">
                <table class="grid-table">
                    <tr>
                        <td width="33%">
                            <span class="item-label">Father</span>
                            <span class="item-value">{{ $family->father_name ?? 'N/A' }}</span>
                            @if($family && $family->father_occupation)
                                <span style="font-size: 10px; color: #64748b;">{{ $family->father_occupation }}</span>
                            @endif
                        </td>
                        <td width="33%">
                            <span class="item-label">Mother</span>
                            <span class="item-value">{{ $family->mother_name ?? 'N/A' }}</span>
                            @if($family && $family->mother_occupation)
                                <span style="font-size: 10px; color: #64748b;">{{ $family->mother_occupation }}</span>
                            @endif
                        </td>
                        <td width="33%">
                            <span class="item-label">Siblings</span>
                            <span class="item-value">
                                @if($family)
                                    {{ $family->no_of_brothers > 0 ? $family->no_of_brothers . ' Brother(s)' : '' }}
                                    {{ $family->no_of_brothers > 0 && $family->no_of_sisters > 0 ? ' & ' : '' }}
                                    {{ $family->no_of_sisters > 0 ? $family->no_of_sisters . ' Sister(s)' : '' }}
                                    {{ $family->no_of_brothers == 0 && $family->no_of_sisters == 0 ? 'None' : '' }}
                                @else
                                    N/A
                                @endif
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="item-label">Family Type</span>
                            <span class="item-value">{{ $family->family_type ?? 'N/A' }}</span>
                        </td>
                        <td colspan="2">
                            <span class="item-label">Family Values</span>
                            <span class="item-value">{{ $spiritual->family_value->name ?? 'N/A' }}</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- 2 col Lifestyle & Hobbies -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" page-break-inside="avoid">
            <tr>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Lifestyle</div>
                        <div class="card">
                            <table class="grid-table">
                                <tr>
                                    <td width="50%">
                                        <span class="item-label">Diet</span>
                                        <span class="item-value">{{ $lifestyle->diet ?? 'N/A' }}</span>
                                    </td>
                                    <td width="50%">
                                        <span class="item-label">Living With</span>
                                        <span class="item-value">{{ $lifestyle->living_with ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="item-label">Smoke</span>
                                        <span class="item-value">{{ $lifestyle->smoke ?? 'N/A' }}</span>
                                    </td>
                                    <td>
                                        <span class="item-label">Drink</span>
                                        <span class="item-value">{{ $lifestyle->drink ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td style="width: 4%;"></td>
                <td style="width: 48%; vertical-align: top;">
                    <div class="section" style="margin-bottom: 0;">
                        <div class="section-title">Hobbies & Interests</div>
                        <div class="card">
                            @php
                                $userHobby = $user->hobbies ?? null;
                            @endphp
                            <table class="grid-table">
                                <tr>
                                    <td colspan="2">
                                        <span class="item-label">Hobbies</span>
                                        <span class="item-value">{{ $userHobby->hobbies ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        <span class="item-label">Interests</span>
                                        <span class="item-value">{{ $userHobby->interests ?? 'N/A' }}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
        
        <!-- Partner Expectations -->
        @if($partner)
        <div class="section">
            <div class="section-title" style="color: #e11d48; border-color: #fecdd3;">Partner Expectations</div>
            <div class="card partner-card">
                <table class="grid-table">
                    <tr>
                        <td width="33%">
                            <span class="item-label partner-label">Age Range</span>
                            <span class="item-value partner-value">{{ $partner->min_age ?? 'Any' }} - {{ $partner->max_age ?? 'Any' }} yrs</span>
                        </td>
                        <td width="33%">
                            <span class="item-label partner-label">Height Range</span>
                            <span class="item-value partner-value">{{ $partner->height ?? 'Any' }} - {{ $partner->height_max ?? 'Any' }}</span>
                        </td>
                        <td width="33%">
                            <span class="item-label partner-label">Religion</span>
                            <span class="item-value partner-value">{{ $partner->religion->name ?? 'Any' }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="item-label partner-label">Marital Status</span>
                            <span class="item-value partner-value">{{ optional(\App\Models\MaritalStatus::find($partner->marital_status_id))->name ?? 'Any' }}</span>
                        </td>
                        <td>
                            <span class="item-label partner-label">Caste</span>
                            <span class="item-value partner-value">{{ optional(\App\Models\Caste::find($partner->caste_id))->name ?? 'Any' }}</span>
                        </td>
                        <td>
                            <span class="item-label partner-label">Residence</span>
                            <span class="item-value partner-value">{{ optional(\App\Models\Country::find($partner->residence_country_id))->name ?? 'Any' }}</span>
                        </td>
                    </tr>
                    @if($partner->general)
                    <tr>
                        <td colspan="3" style="padding-top: 15px;">
                            <span class="item-label partner-label">Ideal Partner Overview</span>
                            <span class="item-value partner-value" style="font-style: italic;">"{{ $partner->general }}"</span>
                        </td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>
        @endif

        <div class="footer">
            Generated securely by the Family Portal. This document contains highly confidential profile information.<br>
            Please respect the user's privacy and do not distribute without explicitly granted permission.
        </div>
    </div>
</body>

</html>
