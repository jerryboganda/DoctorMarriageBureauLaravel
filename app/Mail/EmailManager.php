<?php

namespace App\Mail;

use App\Utility\EmailUtility;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailManager extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public $array;

    public function __construct($array)
    {
        $this->array = $array;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->view($this->array['view'])
            ->with($this->array)
            ->from($this->array['from'] ?? EmailUtility::fromAddress(), $this->array['from_name'] ?? EmailUtility::fromName())
            ->subject($this->array['subject']);
    }
}
