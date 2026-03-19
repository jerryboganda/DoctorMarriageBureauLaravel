<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        /* ── Reset & Base ─────────────────────────────── */
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-size: 10px;
            line-height: 1.35;
        }

        /* ── Spacing rhythm: 4-8-12 system ────────────── */
        .brand-bar { text-align: center; padding: 10px 0 6px 0; }
        .brand-bar img { height: 28px; width: auto; vertical-align: middle; }
        .brand-sep { display: inline-block; width: 28px; }

        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 10px 16px;
        }
        .header-table { width: 100%; border-collapse: collapse; }

        .avatar {
            width: 64px;
            height: 64px;
            border-radius: 6px;
            border: 2px solid rgba(255,255,255,0.3);
            background-color: #334155;
        }
        .name {
            font-size: 17px;
            font-weight: bold;
            color: #ffffff;
            margin: 0 0 1px 0;
            letter-spacing: 0.3px;
        }
        .profile-id {
            font-size: 8px;
            color: #fda4af;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .quick-chips {
            font-size: 8.5px;
            color: #cbd5e1;
            line-height: 1.6;
        }
        .quick-chips b {
            color: #f1f5f9;
            font-weight: 600;
        }
        .chip-sep { color: #475569; }

        /* ── Content area ──────────────────────────────── */
        .content { padding: 8px 16px 4px 16px; }

        /* ── Section system ────────────────────────────── */
        .sec { margin-bottom: 7px; }
        .sec-head {
            font-size: 9px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            border-bottom: 1.5px solid #e2e8f0;
            padding-bottom: 2px;
            margin-bottom: 4px;
        }
        .sec-head-accent {
            color: #be123c;
            border-color: #fecdd3;
        }
        .sec-icon {
            font-size: 10px;
            margin-right: 3px;
        }

        /* ── Card containers ───────────────────────────── */
        .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 0;
        }
        .card-accent {
            background: #fff1f2;
            border-color: #fecdd3;
        }
        .card-edu {
            background: #f0f9ff;
            border-color: #bae6fd;
            padding: 5px 8px;
            margin-bottom: 3px;
            border-radius: 4px;
        }
        .card-career {
            background: #f0fdf4;
            border-color: #bbf7d0;
            padding: 5px 8px;
            margin-bottom: 3px;
            border-radius: 4px;
        }

        /* ── Grid cells ────────────────────────────────── */
        .g { width: 100%; border-collapse: collapse; }
        .g td { padding: 4px 6px; vertical-align: top; }

        /* ── Label / Value typography ──────────────────── */
        .lbl {
            font-size: 7px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 1px;
            display: block;
        }
        .val {
            font-size: 10px;
            color: #0f172a;
            font-weight: 600;
            display: block;
        }
        .lbl-rose { color: #e11d48; }
        .val-rose { color: #881337; }

        .about-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 5px 8px;
            font-size: 9px;
            color: #475569;
            line-height: 1.45;
            font-style: italic;
        }

        /* ── 2-column layout wrapper ──────────────────── */
        .row2 { width: 100%; border-collapse: collapse; margin-bottom: 7px; }
        .row2 .col-l { width: 48.5%; vertical-align: top; }
        .row2 .col-gap { width: 3%; }
        .row2 .col-r { width: 48.5%; vertical-align: top; }

        /* ── Education / Career list items ─────────────── */
        .edu-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
        }
        .edu-sub {
            font-size: 7.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ── Footer ────────────────────────────────────── */
        .footer-bar {
            text-align: center;
            padding: 6px 16px 2px 16px;
            border-top: 1.5px solid #e2e8f0;
            margin-top: 6px;
        }
        .footer-brand {
            font-size: 9px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.5px;
        }
        .footer-wa {
            font-size: 9px;
            font-weight: bold;
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

        // Humanise raw DB values like "early_bird" → "Early Bird"
        $fmt = fn($v) => $v ? ucwords(str_replace('_', ' ', $v)) : 'N/A';
    @endphp

    {{-- ═══════════════ BRAND BAR (centered) ═══════════════ --}}
    <div class="brand-bar">
        @if(file_exists(public_path('assets/img/logo.png')))
            <img src="{{ public_path('assets/img/logo.png') }}" alt="DMB">
        @else
            <span style="font-size: 13px; font-weight: bold; color: #0f172a;">DOCTOR MARRIAGE BUREAU</span>
        @endif
        <span class="brand-sep"></span>
        @if(file_exists(public_path('assets/img/sponsor-logo.png')))
            <img src="{{ public_path('assets/img/sponsor-logo.png') }}" alt="Sponsor">
        @endif
    </div>

    {{-- ═══════════════ HEADER BANNER ═══════════════ --}}
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 74px; vertical-align: middle;">
                    @if($user->photo)
                        <img src="{{ public_path($user->photo) }}" class="avatar">
                    @else
                        <div class="avatar"></div>
                    @endif
                </td>
                <td style="vertical-align: middle; padding-left: 12px;">
                    <div class="name">{{ $user->first_name }} {{ $user->last_name }}</div>
                    <div class="profile-id">PROFILE ID: {{ $user->code ?? $user->id }}</div>
                    <div class="quick-chips">
                        <b>{{ $age ? $age . ' yrs' : 'N/A' }}</b> <span class="chip-sep">&middot;</span>
                        <b>{{ $religion }}</b> <span class="chip-sep">&middot;</span>
                        <b>{{ $marital_status }}</b> <span class="chip-sep">&middot;</span>
                        <b>{{ $location }}</b> <span class="chip-sep">&middot;</span>
                        <b>{{ $profession }}</b> <span class="chip-sep">&middot;</span>
                        <b>{{ $degree }}</b>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ═══════════════ BODY CONTENT ═══════════════ --}}
    <div class="content">

        {{-- About --}}
        @if($member && $member->introduction)
        <div class="sec">
            <div class="sec-head"><span class="sec-icon">&#9998;</span> About</div>
            <div class="about-box">"{{ Str::limit($member->introduction, 220) }}"</div>
        </div>
        @endif

        {{-- ── ROW 1: Basic Information (full width, 6 cols) ─────── --}}
        <div class="sec">
            <div class="sec-head"><span class="sec-icon">&#9734;</span> Basic Information</div>
            <div class="card">
                <table class="g">
                    <tr>
                        <td width="16.6%"><span class="lbl">Gender</span><span class="val">{{ ($member->gender ?? 1) == 2 ? 'Female' : 'Male' }}</span></td>
                        <td width="16.6%"><span class="lbl">Age</span><span class="val">{{ $age ? $age . ' Yrs' : 'N/A' }}</span></td>
                        <td width="16.6%"><span class="lbl">Marital Status</span><span class="val">{{ $marital_status }}</span></td>
                        <td width="16.6%"><span class="lbl">Religion</span><span class="val">{{ $religion }}</span></td>
                        <td width="16.6%"><span class="lbl">Caste</span><span class="val">{{ $spiritual->caste->name ?? 'N/A' }}</span></td>
                        <td width="16.6%"><span class="lbl">Mother Tongue</span><span class="val">{{ $member->mothereTongue->name ?? 'N/A' }}</span></td>
                    </tr>
                </table>
            </div>
        </div>

        {{-- ── ROW 2: Education | Career ─────────────────────── --}}
        <table class="row2">
            <tr>
                <td class="col-l">
                    <div class="sec" style="margin-bottom:0;">
                        <div class="sec-head"><span class="sec-icon">&#127891;</span> Education</div>
                        @if($education && $education->count() > 0)
                            @foreach($education->sortByDesc('end')->take(2) as $edu)
                            <div class="card-edu">
                                <span class="edu-title">{{ $edu->degree }}</span>
                                @if($edu->institution)<br><span class="edu-sub">{{ $edu->institution }}</span>@endif
                            </div>
                            @endforeach
                        @else
                            <div class="card-edu"><span class="val">N/A</span></div>
                        @endif
                    </div>
                </td>
                <td class="col-gap"></td>
                <td class="col-r">
                    <div class="sec" style="margin-bottom:0;">
                        <div class="sec-head"><span class="sec-icon">&#128188;</span> Career</div>
                        @if($career && $career->count() > 0)
                            @foreach($career->sortByDesc('present')->sortByDesc('end')->take(2) as $job)
                            <div class="card-career">
                                <span class="edu-title">{{ $job->designation }}</span>
                                @if($job->company)<br><span class="edu-sub">{{ $job->company }}</span>@endif
                            </div>
                            @endforeach
                        @else
                            <div class="card-career"><span class="val">N/A</span></div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        {{-- ── ROW 3: Religious Context | Residence (3+3 balanced) ── --}}
        <table class="row2">
            <tr>
                <td class="col-l">
                    <div class="sec" style="margin-bottom:0;">
                        <div class="sec-head"><span class="sec-icon">&#9770;</span> Religious Context</div>
                        <div class="card">
                            <table class="g">
                                <tr>
                                    <td width="50%"><span class="lbl">Religion</span><span class="val">{{ $religion }}</span></td>
                                    <td width="50%"><span class="lbl">Caste</span><span class="val">{{ $spiritual->caste->name ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td colspan="2"><span class="lbl">Sect / Ethnicity</span><span class="val">{{ $spiritual->ethnicity ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td class="col-gap"></td>
                <td class="col-r">
                    <div class="sec" style="margin-bottom:0;">
                        <div class="sec-head"><span class="sec-icon">&#127968;</span> Residence</div>
                        <div class="card">
                            <table class="g">
                                <tr>
                                    <td width="50%"><span class="lbl">Country</span><span class="val">{{ $address->country->name ?? 'N/A' }}</span></td>
                                    <td width="50%"><span class="lbl">City</span><span class="val">{{ $address->city->name ?? 'N/A' }}</span></td>
                                </tr>
                                <tr>
                                    <td colspan="2"><span class="lbl">Nationality</span><span class="val">{{ $member->nationality ?? 'N/A' }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        {{-- ── ROW 4: Physical Appearance | Lifestyle (6+6 balanced) ── --}}
        <table class="row2">
            <tr>
                <td class="col-l">
                    <div class="sec" style="margin-bottom:0;">
                        <div class="sec-head"><span class="sec-icon">&#9889;</span> Physical Appearance</div>
                        <div class="card">
                            <table class="g">
                                <tr>
                                    <td width="33%"><span class="lbl">Height</span><span class="val">{{ $heightStr ?: 'N/A' }}</span></td>
                                    <td width="33%"><span class="lbl">Weight</span><span class="val">{{ $physical->weight ? $physical->weight . ' kg' : 'N/A' }}</span></td>
                                    <td width="33%"><span class="lbl">Complexion</span><span class="val">{{ $fmt($physical->complexion ?? null) }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="lbl">Body Type</span><span class="val">{{ $fmt($physical->body_type ?? null) }}</span></td>
                                    <td><span class="lbl">Eye Color</span><span class="val">{{ $fmt($physical->eye_color ?? null) }}</span></td>
                                    <td><span class="lbl">Hair Color</span><span class="val">{{ $fmt($physical->hair_color ?? null) }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
                <td class="col-gap"></td>
                <td class="col-r">
                    <div class="sec" style="margin-bottom:0;">
                        <div class="sec-head"><span class="sec-icon">&#9752;</span> Lifestyle</div>
                        <div class="card">
                            <table class="g">
                                <tr>
                                    <td width="50%"><span class="lbl">Diet</span><span class="val">{{ $fmt($lifestyle->diet ?? null) }}</span></td>
                                    <td width="50%"><span class="lbl">Living With</span><span class="val">{{ $fmt($lifestyle->living_with ?? null) }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="lbl">Smoke</span><span class="val">{{ $fmt($lifestyle->smoke ?? null) }}</span></td>
                                    <td><span class="lbl">Drink</span><span class="val">{{ $fmt($lifestyle->drink ?? null) }}</span></td>
                                </tr>
                                <tr>
                                    <td><span class="lbl">Sleep Schedule</span><span class="val">{{ $fmt($lifestyle->sleep_schedule ?? null) }}</span></td>
                                    <td><span class="lbl">Property / House</span><span class="val">{{ $fmt($lifestyle->property ?? null) }}</span></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        {{-- ── ROW 5: Family Information (full width) ─────────── --}}
        <div class="sec">
            <div class="sec-head"><span class="sec-icon">&#128106;</span> Family Information</div>
            <div class="card">
                <table class="g">
                    <tr>
                        <td width="25%"><span class="lbl">Father's Name</span><span class="val">{{ $family->father_name ?? 'N/A' }}</span></td>
                        <td width="25%"><span class="lbl">Father's Occupation</span><span class="val">{{ $family->father_occupation ?? 'N/A' }}</span></td>
                        <td width="25%"><span class="lbl">Mother's Name</span><span class="val">{{ $family->mother_name ?? 'N/A' }}</span></td>
                        <td width="25%"><span class="lbl">Mother's Occupation</span><span class="val">{{ $family->mother_occupation ?? 'N/A' }}</span></td>
                    </tr>
                    <tr>
                        <td><span class="lbl">Siblings</span><span class="val">@if($family){{ $family->no_of_brothers > 0 ? $family->no_of_brothers . ' Brother(s)' : '' }}{{ $family->no_of_brothers > 0 && $family->no_of_sisters > 0 ? ' & ' : '' }}{{ $family->no_of_sisters > 0 ? $family->no_of_sisters . ' Sister(s)' : '' }}{{ $family->no_of_brothers == 0 && $family->no_of_sisters == 0 ? 'None' : '' }}@else N/A @endif</span></td>
                        <td><span class="lbl">Family Type</span><span class="val">{{ $fmt($family->family_type ?? null) }}</span></td>
                        <td colspan="2"><span class="lbl">Family Values</span><span class="val">{{ $spiritual->family_value->name ?? 'N/A' }}</span></td>
                    </tr>
                </table>
            </div>
        </div>

        {{-- ── ROW 6: Hobbies (compact, only if data exists) ──── --}}
        @php $userHobby = $user->hobbies ?? null; @endphp
        @if($userHobby && ($userHobby->hobbies || $userHobby->interests))
        <div class="sec">
            <div class="sec-head"><span class="sec-icon">&#9733;</span> Hobbies & Interests</div>
            <div class="card">
                <table class="g">
                    <tr>
                        <td width="50%"><span class="lbl">Hobbies</span><span class="val">{{ $userHobby->hobbies ?? 'N/A' }}</span></td>
                        <td width="50%"><span class="lbl">Interests</span><span class="val">{{ $userHobby->interests ?? 'N/A' }}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        @endif

        {{-- ── ROW 7: Partner Expectations (full width, accented) ── --}}
        @if($partner)
        <div class="sec">
            <div class="sec-head sec-head-accent"><span class="sec-icon">&#10084;</span> Partner Expectations</div>
            <div class="card card-accent">
                <table class="g">
                    <tr>
                        <td width="33%"><span class="lbl lbl-rose">Age Range</span><span class="val val-rose">{{ $partner->min_age ?? 'Any' }} - {{ $partner->max_age ?? 'Any' }} yrs</span></td>
                        <td width="33%"><span class="lbl lbl-rose">Height Range</span><span class="val val-rose">{{ $partner->height ?? 'Any' }} - {{ $partner->height_max ?? 'Any' }}</span></td>
                        <td width="33%"><span class="lbl lbl-rose">Religion</span><span class="val val-rose">{{ $partner->religion->name ?? 'Any' }}</span></td>
                    </tr>
                    <tr>
                        <td><span class="lbl lbl-rose">Marital Status</span><span class="val val-rose">{{ optional(\App\Models\MaritalStatus::find($partner->marital_status_id))->name ?? 'Any' }}</span></td>
                        <td><span class="lbl lbl-rose">Caste</span><span class="val val-rose">{{ optional(\App\Models\Caste::find($partner->caste_id))->name ?? 'Any' }}</span></td>
                        <td><span class="lbl lbl-rose">Residence</span><span class="val val-rose">{{ optional(\App\Models\Country::find($partner->residence_country_id))->name ?? 'Any' }}</span></td>
                    </tr>
                    <tr>
                        <td><span class="lbl lbl-rose">Education</span><span class="val val-rose">{{ $partner->education ?? 'Any' }}</span></td>
                        <td><span class="lbl lbl-rose">Language</span><span class="val val-rose">{{ $partner->member_language->name ?? 'Any' }}</span></td>
                        <td><span class="lbl lbl-rose">Family Values</span><span class="val val-rose">{{ $partner->family_value->name ?? 'Any' }}</span></td>
                    </tr>
                    @if($partner->general)
                    <tr>
                        <td colspan="3" style="padding-top: 3px;">
                            <span class="lbl lbl-rose">Ideal Partner</span>
                            <span class="val val-rose" style="font-style: italic; font-size: 9px; font-weight: 500;">"{{ Str::limit($partner->general, 180) }}"</span>
                        </td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>
        @endif

    </div>

    {{-- ═══════════════ FOOTER ═══════════════ --}}
    <div class="footer-bar">
        <div class="footer-brand">Doctor Marriage Bureau</div>
        @if($whatsapp)
            <div class="footer-wa">WhatsApp: {{ $whatsapp }}</div>
        @endif
        <div class="footer-legal">This document is confidential. Please respect privacy and do not distribute without permission.</div>
    </div>
</body>

</html>
