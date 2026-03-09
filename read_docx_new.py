import zipfile
with zipfile.ZipFile('Información de la creación del proyecto.docx') as docx:
    with docx.open('word/document.xml') as doc_xml:
        xml_content = doc_xml.read().decode('utf-8')
        import re
        text = re.sub('<[^<]+>', '', xml_content)
        with open('requirements_clean.txt', 'w', encoding='utf-8') as f:
            f.write(text)
print("Done")
