<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class FirbaseNotification
{
    public static function send($data)
    {
        $url = 'https://fcm.googleapis.com/fcm/send';

        $fields = [
            'to' => $data->fcm_token,
            'notification' => [
                'body' => $data->text,
                'title' => str_replace('_', ' ', $data->title),
                'sound' => 'default', /* Default sound */
            ],
            'data' => [
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                'route' => $data->title,
                'notify_by' => $data->notify_by,

            ],
        ];

        // $fields = json_encode($arrayToSend);
        $headers = [
            'Authorization: key='.env('FIREBASE_SERVER_KEY'),
            'Content-Type: application/json',
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));

        $result = curl_exec($ch);
        if ($result === false) {
            Log::warning('Firebase notification request failed', [
                'error' => curl_error($ch),
                'errno' => curl_errno($ch),
            ]);
        }
        curl_close($ch);

        return $result !== false;
    }
}
