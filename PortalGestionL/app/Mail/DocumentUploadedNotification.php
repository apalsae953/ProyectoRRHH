<?php

namespace App\Mail;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentUploadedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $document;

    public function __construct(Document $document)
    {
        $this->document = $document;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tienes un nuevo documento disponible en Globomatik',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.document_uploaded',
            with: [
                'typeLabel' => $this->getTypeLabel($this->document->type),
                'url' => config('app.frontend_url') . '/documentos',
            ]
        );
    }

    private function getTypeLabel($type)
    {
        return [
            'payroll' => 'Nómina',
            'contract' => 'Contrato',
            'certificate' => 'Certificado',
            'other' => 'Documento',
        ][$type] ?? 'Documento';
    }

    public function attachments(): array
    {
        return [];
    }
}
