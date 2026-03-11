<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VacationCanceledAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public \App\Models\Vacation $vacation;

    /**
     * Create a new message instance.
     */
    public function __construct(\App\Models\Vacation $vacation)
    {
        $this->vacation = $vacation;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Notificación: Solicitud de Vacaciones Cancelada (' . $this->vacation->user->name . ' ' . $this->vacation->user->surname . ')',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.vacations.canceled_admin',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
