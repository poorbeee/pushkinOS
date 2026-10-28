import requests
from bs4 import BeautifulSoup
import re
import json

# 1. Загружаем страницу
url = "https://ip.libomsk.ru/lpk"
response = requests.get(url)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.text, 'html.parser')

# 2. Ищем все текстовые блоки
text_blocks = soup.find_all(['p', 'div', 'span'])
full_text = " ".join([block.get_text(separator=' ') for block in text_blocks])

# 3. Регулярное выражение для поиска дат и событий
# Пример: "8 февраля (27 января) 1837 года на окраине Петербурга..."
pattern = r'(\d{1,2})\s+([а-я]+)\s+\((\d{1,2})\s+[а-я]+\)\s+(\d{4})\s+года\s+([^\.]+\.)'
matches = re.findall(pattern, full_text, re.IGNORECASE)

events = []
months = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
}

for match in matches:
    day, month_name, old_day, year, text = match
    month = months.get(month_name.lower())
    if month:
        events.append({
            "date": f"{month}-{int(day):02d}",
            "year": int(year),
            "text": text.strip()
        })

# 4. Сохраняем в JSON
with open('extracted_events.json', 'w', encoding='utf-8') as f:
    json.dump(events, f, ensure_ascii=False, indent=2)

print(f"Готово! Найдено и сохранено {len(events)} событий.")