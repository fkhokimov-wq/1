# EIP Grant Management System

**Система управления грантовыми заявками** — веб-приложение для полного цикла обработки грантовых заявок: от подачи заявки до мониторинга выданного гранта.

## Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Frontend | Vanilla JavaScript (ES5+) |
| Стилизация | Tailwind CSS (CDN) |
| Иконки | Lucide Icons (CDN) |
| Шрифты | Google Fonts — Inter |
| Персистентность | In-memory (состояние в `window.state`) |
| Бэкенд | Нет (фронтенд-прототип) |

## Быстрый старт

```bash
# Вариант 1: Просто откройте файл в браузере
open grant.html

# Вариант 2: Локальный HTTP-сервер
npx serve .
# или
python3 -m http.server 8000
```

Перейдите на `http://localhost:8000/grant.html`

## Структура проекта

```
grant.html                          # Главная страница (HTML + модальные окна)
src/
├── js/
│   ├── app.js                      # Точка входа — загрузчик модулей
│   ├── config/
│   │   └── tailwind.config.js      # Конфигурация Tailwind (цвета, шрифты)
│   ├── core/
│   │   └── utils.js                # Утилиты: sanitize, addLog, dateTime
│   ├── state/
│   │   ├── seed-dictionaries.js    # Справочники: бенефициары, mockDatabase
│   │   ├── seed-applications.js    # Тестовые заявки и протоколы
│   │   ├── seed-monitoring.js      # Тестовые данные мониторинга
│   │   ├── seed-data.js            # Сборка state из seed-модулей
│   │   └── store.js                # Хранилище: getApp, filterApps
│   ├── ui/
│   │   └── render.js               # Рендеринг карточек, фильтры, бейджи
│   └── features/
│       ├── facilitator.js          # Логика роли Фасилитатор
│       ├── gmc.js                  # Логика роли ШИГ/КУГ
│       ├── piu.js                  # Логика роли ГРП/PIU
│       ├── committee.js            # Логика роли Комитет
│       └── monitoring.js           # Мониторинг выданных грантов
└── styles/
    └── main.css                    # Кастомные стили
```

## Документация

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Техническая архитектура, UML-диаграммы компонентов |
| [BUSINESS-PROCESSES.md](docs/BUSINESS-PROCESSES.md) | Все бизнес-процессы, взаимодействие сторон, sequence-диаграммы |
| [WORKFLOW.md](docs/WORKFLOW.md) | Жизненный цикл заявки, диаграмма переходов статусов |
| [DATA-MODEL.md](docs/DATA-MODEL.md) | Модель данных, ER-диаграмма |
| [ACCESS-CONTROL.md](docs/ACCESS-CONTROL.md) | Матрица доступов по ролям |
| [UI-GUIDE.md](docs/UI-GUIDE.md) | Описание интерфейса, экранов, фильтров |

## Языки интерфейса

Интерфейс билингвальный: **таджикский** (основной) + **русский** (дублирующий).  
Все метки содержат оба языка: `<span class="ru">/ русский текст</span>`
