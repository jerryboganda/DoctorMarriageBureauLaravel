<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Biodata - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }

        /* Table Layout ensures structure stays even on PDF generation */
        .main-layout {
            width: 100%;
            border-collapse: collapse;
        }

        .sidebar-cell {
            width: 32%;
            background-color: #1e293b;
            color: white;
            padding: 25px;
            vertical-align: top;
        }

        .content-cell {
            width: 68%;
            background-color: white;
            padding: 30px;
            vertical-align: top;
        }

        /* Sidebar Elements */
        .profile-img-container {
            text-align: center;
            margin-bottom: 30px;
        }

        .profile-img {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            border: 4px solid #e11d48;
            object-fit: cover;
        }

        .sidebar-item {
            margin-bottom: 25px;
            border-bottom: 1px solid #334155;
            padding-bottom: 15px;
        }

        .sidebar-item:last-child {
            border-bottom: none;
        }

        .sidebar-label {
            color: #fda4af;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .sidebar-value {
            color: #f1f5f9;
            font-size: 13px;
            font-weight: 500;
            word-wrap: break-word;
        }

        /* Content Elements */
        .header-logo {
            text-align: right;
            margin-bottom: 20px;
        }

        .header-logo img {
            height: 50px;
        }

        .name-header {
            margin-bottom: 5px;
        }

        .name-header h1 {
            font-size: 32px;
            color: #e11d48;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 1px;
        }

        .profile-id {
            color: #64748b;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .profile-tagline {
            color: #0f172a;
            font-size: 16px;
            margin-top: 5px;
            font-weight: 500;
        }

        .content-section {
            margin-top: 35px;
        }

        .section-header {
            font-size: 15px;
            color: #1e293b;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #e11d48;
            padding-bottom: 8px;
            margin-bottom: 15px;
            letter-spacing: 1px;
        }

        .data-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .data-grid td {
            padding: 8px 0;
            vertical-align: top;
            font-size: 13px;
            border-bottom: 1px solid #f1f5f9;
        }

        .data-grid tr:last-child td {
            border-bottom: none;
        }

        .grid-label {
            width: 35%;
            color: #64748b;
            font-weight: 600;
        }

        .grid-value {
            width: 65%;
            color: #0f172a;
            font-weight: 500;
        }

        .badges-container {
            margin-top: 5px;
        }

        .badge {
            display: inline-block;
            background: #e11d48;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            margin-right: 5px;
        }
    </style>
</head>

<body style="margin: 0; padding: 0;">
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

    <table class="main-layout" style="height: 100%;">
        <tr>
            <!-- Sidebar Column -->
            <td class="sidebar-cell">
                <div class="profile-img-container">
                    @if($user->photo)
                        <img src="{{ public_path($user->photo) }}" class="profile-img">
                    @else
                        <div
                            style="width: 140px; height: 140px; border-radius: 50%; border: 4px solid #e11d48; background: #334155; margin: 0 auto;">
                        </div>
                    @endif
                </div>

                <div class="sidebar-item">
                    <div class="sidebar-label">Age & Height</div>
                    <div class="sidebar-value">
                        {{ $member->birthday ? date_diff(date_create($member->birthday), date_create('today'))->y : 'N/A' }}
                        Years,
                        @if($physical && $physical->height)
                            {{ floor($physical->height / 30.48) }}' {{ round(($physical->height % 30.48) / 2.54) }}"
                        @endif
                    </div>
                </div>

                <div class="sidebar-item">
                    <div class="sidebar-label">Marital Status</div>
                    <div class="sidebar-value">{{ $member->marital_status->name ?? 'N/A' }}</div>
                </div>

                <div class="sidebar-item">
                    <div class="sidebar-label">Location</div>
                    <div class="sidebar-value">{{ $address->city->name ?? '' }}, {{ $address->country->name ?? '' }}
                    </div>
                </div>

                <div class="sidebar-item">
                    <div class="sidebar-label">Mother Tongue</div>
                    <div class="sidebar-value">{{ $member->mothereTongue->name ?? 'N/A' }}</div>
                </div>

                <div class="sidebar-item">
                    <div class="sidebar-label">Contact</div>
                    <div class="sidebar-value">Contact via Platform</div>
                </div>
            </td>

            <!-- Content Column -->
            <td class="content-cell">
                <!-- Header Logo -->
                <div class="header-logo">
                    @if($logo != null)
                        <img src="{{ uploaded_asset($logo) }}">
                    @else
                        <!-- Fallback to text if image fails or default is unwanted -->
                        <h2 style="color: #e11d48; margin: 0;">Doctor Marriage Bureau</h2>
                    @endif
                </div>

                <div class="name-header">
                    <h1>{{ $user->first_name }} {{ $user->last_name }}</h1>
                    <div class="profile-id">ID: {{ $user->id }} • Updated {{ date('M Y') }}</div>
                    @if($member->introduction)
                        <div class="profile-tagline"
                            style="font-style: italic; color: #475569; margin-top: 10px; font-size: 14px;">
                            "{{ Str::limit($member->introduction, 150) }}"
                        </div>
                    @endif
                </div>

                <div class="content-section">
                    <div class="section-header">Education & Profession</div>
                    <table class="data-grid">
                        <tr>
                            <td class="grid-label">Education</td>
                            <td class="grid-value">{{ $education->degree ?? $member->education ?? 'N/A' }}</td>
                        </tr>
                        <tr>
                            <td class="grid-label">Profession</td>
                            <td class="grid-value">{{ $career->designation ?? $member->designation ?? 'N/A' }}</td>
                        </tr>
                        <tr>
                            <td class="grid-label">Company</td>
                            <td class="grid-value">{{ $career->company ?? $member->company ?? 'N/A' }}</td>
                        </tr>
                        <tr>
                            <td class="grid-label">Annual Income</td>
                            <td class="grid-value">{{ $member->annual_salary_range->name ?? 'N/A' }}</td>
                        </tr>
                    </table>
                </div>

                <div class="content-section">
                    <div class="section-header">Religious Background</div>
                    <table class="data-grid">
                        <tr>
                            <td class="grid-label">Religion</td>
                            <td class="grid-value">{{ $spiritual->religion->name ?? 'N/A' }}</td>
                        </tr>
                        <tr>
                            <td class="grid-label">Caste / Community</td>
                            <td class="grid-value">{{ $spiritual->caste->name ?? 'N/A' }}</td>
                        </tr>
                        <tr>
                            <td class="grid-label">Sect / Ethnicity</td>
                            <td class="grid-value">{{ $spiritual->ethnicity ?? 'N/A' }}</td>
                        </tr>
                    </table>
                </div>

                <div class="content-section">
                    <div class="section-header">Family Details</div>
                    <table class="data-grid">
                        <tr>
                            <td class="grid-label">Father</td>
                            <td class="grid-value">{{ $family->father_name ?? 'N/A' }} <span
                                    style="color:#64748b; font-size:11px;">({{ $family->father_profession ?? '' }})</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="grid-label">Mother</td>
                            <td class="grid-value">{{ $family->mother_name ?? 'N/A' }} <span
                                    style="color:#64748b; font-size:11px;">({{ $family->mother_profession ?? '' }})</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="grid-label">Siblings</td>
                            <td class="grid-value">{{ $family->sibling_details ?? 'N/A' }}</td>
                        </tr>
                        <tr>
                            <td class="grid-label">Family Background</td>
                            <td class="grid-value">{{ $spiritual->family_value->name ?? 'N/A' }} Values,
                                {{ $family->family_type ?? '' }} Family</td>
                        </tr>
                    </table>
                </div>

                <div class="content-section">
                    <div class="section-header">Lifestyle</div>
                    <table class="data-grid">
                        <tr>
                            <td class="grid-label">Habits</td>
                            <td class="grid-value">
                                @if($lifestyle->diet) <span style="margin-right: 10px;">Diet:
                                {{ $lifestyle->diet }}</span> @endif
                                @if($lifestyle->smoke == 'Yes') <span style="margin-right: 10px;">Smokes</span> @endif
                                @if($lifestyle->drink == 'Yes') <span style="margin-right: 10px;">Drinks</span> @endif
                                @if(!$lifestyle->smoke && !$lifestyle->drink && !$lifestyle->diet) Not Specified @endif
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>
</body>

</html>