<?php

declare(strict_types=1);

$source = dirname(__DIR__, 2) . '/Links-20260928T050055Z-1-001/Links';
$target = dirname(__DIR__) . '/assets';

if (!is_dir($target)) {
    mkdir($target, 0775, true);
}

$photos = [
    '1 Tambang DSC_4911.jpg' => ['hero-tambang.webp', 1920],
    '2 OB@Tambang DSC_4929.jpg' => ['operasi-tambang.webp', 1400],
    '5 hauling DSC_5026.jpg' => ['angkutan-tambang.webp', 1400],
    '6 ISP DSC_4837_1.jpg' => ['penyiapan-lahan.webp', 1200],
    '6 ISP DSC_4884.jpg' => ['pemuatan-batubara.webp', 1400],
    '7 Barging Triop.jpg' => ['pengapalan-batubara.webp', 1600],
    '3 ISP DSC_4892.jpg' => ['tumpukan-batubara.webp', 1400],
    '6 ISP DSC_4742.jpg' => ['pemuatan-armada.webp', 1400],
    '6 ISP DSC_4837.jpg' => ['material-tambang.webp', 1400],
    'DSCF0114.JPG' => ['ekskavator-tambang.webp', 1400],
    'WhatsApp Image 2025-11-03 at 16.20.35 (2).jpeg' => ['armada-dan-ekskavator.webp', 1400],
    // A '#suffix' keeps array keys unique when one source photo has two outputs.
    '2 OB@Tambang DSC_4929.jpg' . '#hero' => ['hero-mining.webp', 2000],
    '5 hauling DSC_5026.jpg' . '#hero' => ['hero-infrastructure.webp', 2000],
    '7 Barging Triop.jpg' . '#hero' => ['hero-shipping.webp', 2048],
    'PHOTO-2026-03-05-15-51-22.jpg' => ['k3-bulan-nasional.webp', 1600],
    'AR 2021.png' => ['ar-2021.webp', 600],
    'AR 2022.png' => ['ar-2022.webp', 600],
    'AR 2023.png' => ['ar-2023.webp', 600],
    'AR 2024.png' => ['ar-2024.webp', 600],
    'construction-site-with-cranes-against-blue-sky.jpg' => ['konstruksi.webp', 1800],
    'IANZ3552.jpg' => ['buldoser-pembukaan-lahan.webp', 1000],
    'ARA00651.JPG' => ['governance-meeting.webp', 1800],
    'foto bersama.png' => ['leadership-team.webp', 1200],
    // Third value crops [x, y, width, height] first; here it drops the geotag bar along the bottom.
    'h. Stockpile_geotag.rev1.jpg' => ['stockpile-jetty-udara.webp', 1280, ['x' => 0, 'y' => 0, 'width' => 1280, 'height' => 590]],
];

foreach ($photos as $filename => $config) {
    [$output, $maxWidth] = $config;
    $crop = $config[2] ?? null;
    $path = $source . '/' . strtok($filename, '#');
    $image = str_ends_with(strtolower($path), '.png') ? imagecreatefrompng($path) : imagecreatefromjpeg($path);
    if ($image === false) {
        throw new RuntimeException("Cannot open {$filename}");
    }
    if ($crop) {
        $image = imagecrop($image, $crop);
    }

    $width = imagesx($image);
    $height = imagesy($image);
    $newWidth = min($maxWidth, $width);
    $newHeight = (int) round($height * $newWidth / $width);
    $resized = imagescale($image, $newWidth, $newHeight, IMG_BICUBIC_FIXED);
    if ($resized === false || !imagewebp($resized, $target . '/' . $output, 78)) {
        throw new RuntimeException("Cannot create {$output}");
    }
    imagedestroy($resized);
    imagedestroy($image);
    echo $output . PHP_EOL;
}

$logo = imagecreatefrompng($source . '/logo baru.png');
if ($logo === false) {
    throw new RuntimeException('Cannot open logo');
}
$logoSize = imagesy($logo);
$mark = imagecrop($logo, ['x' => 0, 'y' => 0, 'width' => $logoSize, 'height' => $logoSize]);
if ($mark === false || !imagepng($mark, $target . '/pkpk-mark.png', 8)) {
    throw new RuntimeException('Cannot create logo mark');
}
imagedestroy($mark);
imagedestroy($logo);
