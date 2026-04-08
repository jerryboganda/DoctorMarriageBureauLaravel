@php
    // Ensure $array is properly initialized
    if (!isset($array) || !is_array($array)) {
        $array = [
            'content' => 'Newsletter content not available.'
        ];
    }
	echo $array['content'] ?? 'Newsletter content not available.';
@endphp
