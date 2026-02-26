<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DbStoreNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($notify_type, $id, $notify_by, $info_id, $message, $route, $title = null)
    {
        $this->notify_type = $notify_type;
        $this->id = $id;
        $this->notify_by = $notify_by;
        $this->info_id = $info_id;
        $this->message = $message;
        $this->route = $route;
        $this->title = $title;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        $data = [
            'type' => $this->notify_type,
            'id' => $this->id,
            'notify_by' => $this->notify_by,
            'info_id' => $this->info_id,
            'message' => $this->message,
            'route' => $this->route,
        ];

        if ($this->title) {
            $data['title'] = $this->title;
        }

        return $data;
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {

    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            //
        ];
    }
}
