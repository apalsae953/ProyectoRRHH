<?php
$zip = new ZipArchive;
$res = $zip->open('Información de la creación del proyecto.docx');
if ($res === TRUE) {
    echo strip_tags($zip->getFromName('word/document.xml'));
    $zip->close();
} else {
    echo "Failed to open docx";
}
