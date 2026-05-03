<?php

namespace App\Support;

class BiodataFormatter
{
    public static function formatHeightForBiodata($rawHeight): ?string
    {
        if ($rawHeight === null) {
            return null;
        }

        $sourceUnit = null;
        $numericValue = null;

        if (is_numeric($rawHeight)) {
            $numericValue = (float) $rawHeight;
        } else {
            $text = trim((string) $rawHeight);
            if ($text === '') {
                return null;
            }

            if (preg_match('/^(\d+(?:\.\d+)?)\s*(?:ft|feet|\')\s*(\d+)?\s*(?:in|\")?$/i', $text, $matches)) {
                $feet = (float) $matches[1];
                $inches = isset($matches[2]) ? (float) $matches[2] : 0.0;
                $totalInches = (int) round(($feet * 12) + $inches);
                return self::formatInches($totalInches);
            }

            if (preg_match('/^(\d+(?:\.\d+)?)\s*cm$/i', $text, $matches)) {
                $numericValue = (float) $matches[1];
                $sourceUnit = 'cm';
            } elseif (preg_match('/^(\d+(?:\.\d+)?)\s*m$/i', $text, $matches)) {
                $numericValue = (float) $matches[1];
                $sourceUnit = 'm';
            } else {
                $clean = preg_replace('/[^0-9\.]/', '', $text);
                if ($clean === '' || !is_numeric($clean)) {
                    return null;
                }
                $numericValue = (float) $clean;
            }
        }

        if ($numericValue === null || $numericValue <= 0) {
            return null;
        }

        if ($sourceUnit === null) {
            if ($numericValue > 20) {
                $sourceUnit = 'cm';
            } elseif ($numericValue >= 3.0 && $numericValue <= 9.0) {
                $sourceUnit = 'ft';
            } elseif ($numericValue >= 1.3 && $numericValue <= 2.5) {
                $sourceUnit = 'm';
            } else {
                return null;
            }
        }

        $totalInches = match ($sourceUnit) {
            'cm' => (int) round($numericValue / 2.54),
            'm' => (int) round(($numericValue * 100) / 2.54),
            'ft' => (int) round($numericValue * 12),
            default => null,
        };

        if ($totalInches === null || $totalInches <= 0) {
            return null;
        }

        return self::formatInches($totalInches);
    }

    public static function buildLifestyleTags($diet, $smoke, $drink): array
    {
        $tags = [];

        $dietText = self::cleanValue($diet);
        $dietNormalized = self::normalizeValue($dietText);
        if ($dietText !== null && !in_array($dietNormalized, ['no preference', 'optional', 'not specified'], true)) {
            $tags[] = $dietText;
        }

        $smokeTag = self::mapSmokeTag($smoke);
        if ($smokeTag !== null) {
            $tags[] = $smokeTag;
        }

        $drinkTag = self::mapDrinkTag($drink);
        if ($drinkTag !== null) {
            $tags[] = $drinkTag;
        }

        return array_values(array_unique($tags));
    }

    private static function mapSmokeTag($value): ?string
    {
        $normalized = self::normalizeValue($value);

        return match ($normalized) {
            'regularly', 'yes' => 'Smokes',
            'occasionally', 'sometimes' => 'Smokes Occasionally',
            'never', 'no', 'non-smoker', 'nonsmoker', '' => null,
            default => null,
        };
    }

    private static function mapDrinkTag($value): ?string
    {
        $normalized = self::normalizeValue($value);

        return match ($normalized) {
            'regularly', 'yes' => 'Drinks',
            'occasionally', 'sometimes' => 'Drinks Occasionally',
            'never', 'no', 'non-drinker', 'nondrinker', '' => null,
            default => null,
        };
    }

    private static function cleanValue($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $clean = trim((string) $value);
        return $clean === '' ? null : $clean;
    }

    private static function normalizeValue($value): string
    {
        if ($value === null) {
            return '';
        }

        $clean = preg_replace('/\s+/', ' ', trim((string) $value));
        return strtolower($clean);
    }

    private static function formatInches(int $totalInches): ?string
    {
        if ($totalInches <= 0) {
            return null;
        }

        $feet = intdiv($totalInches, 12);
        $inches = $totalInches % 12;

        if ($feet < 3 || $feet > 8) {
            return null;
        }

        return sprintf("%d'%d\"", $feet, $inches);
    }
}
