<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppEmailVerificationNotification extends Notification
{
    use Queueable;

    public $user;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($user)
    {
        $this->user = $user;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        // $notifiable->verification_code = encrypt($notifiable->id);
        // $notifiable->save();

        $array['view'] = 'emails.app_verification';
        $array['subject'] = translate('Email Verification');
        $array['content'] = translate('Please enter the code: '.($this->user->verification_code ?? 'N/A'));
        $array['link'] = ''; // Add empty link to prevent template errors

        return (new MailMessage)
            ->view('emails.app_verification', ['array' => $array])
            ->subject(translate('Email Verification - ').config('app.name'));
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
