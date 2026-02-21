<?php

namespace Tests\Unit;

use App\Support\BiodataFormatter;
use PHPUnit\Framework\TestCase;

class BiodataFormatterTest extends TestCase
{
    public function test_formats_height_from_feet_decimal(): void
    {
        $this->assertSame("5'8\"", BiodataFormatter::formatHeightForBiodata(5.68));
    }

    public function test_formats_height_from_centimeters(): void
    {
        $this->assertSame("5'7\"", BiodataFormatter::formatHeightForBiodata(170));
    }

    public function test_formats_height_from_meters(): void
    {
        $this->assertSame("5'6\"", BiodataFormatter::formatHeightForBiodata(1.67));
    }

    public function test_returns_null_for_invalid_or_empty_height(): void
    {
        $this->assertNull(BiodataFormatter::formatHeightForBiodata(null));
        $this->assertNull(BiodataFormatter::formatHeightForBiodata('unknown'));
        $this->assertNull(BiodataFormatter::formatHeightForBiodata(0.75));
    }

    public function test_hides_never_smoke_and_drink_values(): void
    {
        $tags = BiodataFormatter::buildLifestyleTags('Halal (Standard)', 'Never', 'Never');

        $this->assertSame(['Halal (Standard)'], $tags);
    }

    public function test_shows_occasionally_and_regularly_lifestyle_values(): void
    {
        $tags = BiodataFormatter::buildLifestyleTags(null, 'Occasionally', 'Regularly');

        $this->assertSame(['Smokes Occasionally', 'Drinks'], $tags);
    }

    public function test_is_case_insensitive_and_hides_non_meaningful_diet(): void
    {
        $tags = BiodataFormatter::buildLifestyleTags('  No Preference ', ' never ', ' OCCASIONALLY ');

        $this->assertSame(['Drinks Occasionally'], $tags);
    }
}

