<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>500 - Server Error | {{ get_setting('website_name') ?? 'Doctor Marriage Bureau' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .container { text-align: center; padding: 2rem; }
        .code { font-size: 8rem; font-weight: 800; color: #fecaca; line-height: 1; }
        h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; }
        p { color: #64748b; margin-bottom: 2rem; line-height: 1.6; }
        a { display: inline-block; padding: 0.75rem 2rem; background: #6d28d9; color: #fff; border-radius: 9999px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
        a:hover { background: #5b21b6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="code">500</div>
        <h1>{{ translate('Something went wrong!') }}</h1>
        <p>{{ translate("Sorry for the inconvenience, but we're working on it.") }}<br>{{ translate('Error code') }}: 500</p>
        <a href="/">{{ translate('Go Home') }}</a>
    </div>
</body>
</html>
