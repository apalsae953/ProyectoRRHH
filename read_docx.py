import zipfile
import re

def extract_text(docx_filename):
    with zipfile.ZipFile(docx_filename) as z:
        xml_content = z.read('word/document.xml').decode('utf-8')
        
    # Remove XML tags and extract text
    text = re.sub(r'<w:p[^>]*>', '\n', xml_content)
    text = re.sub(r'<[^>]+>', '', text)
    
    with open('docx_output.txt', 'w', encoding='utf-8') as f:
        f.write(text)

extract_text('Información de la creación del proyecto.docx')
