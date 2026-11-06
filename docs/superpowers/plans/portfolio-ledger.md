# Execution ledger

- Ruling: работа в существующей папке без worktree — Git-репозиторий отсутствует; исследование и ТЗ сохраняются отдельно от site.
- Ruling: вначале локальный предпросмотр с отключенным приемом — реквизиты владельца и обработка обращений неизвестны; это еще не публичный запуск.
- Ruling: исполняю сам после одобрения ТЗ — повторного согласования уже разрешенной разработки не запрашиваю.
- Task 1 complete: сервер, валидация, идемпотентное файловое сохранение; исходный набор 8/8 тестов прошел.
- Task 2 complete: семь секций, честная схема Avadas, адаптивная верстка, меню, FAQ, форма и выбор услуги. node --check public/app.js завершился с кодом 0.
- Task 3 verification: HTTP 200, браузер открыт на http://127.0.0.1:4173; проверены 1440 и 390 px, раскрытие FAQ, мобильное меню, переход к кейсу и сохранность полей при выборе услуги. Обязательный прием выключен по условиям частного предпросмотра.
- Final review: отдельный агент нашел порчу UTF-8 при разрыве символа между HTTP chunks. Регрессионный тест воспроизвел ошибку, исправление декодирует объединенный Buffer; полный набор 9/9 прошел.
- Ruling: шрифты пока загружаются из Google Fonts с системным fallback — локальные файлы не установлены; публичная подготовка описана в README.
- Ruling: публичная публикация отложена — нет настоящего контакта и условий обработки обращений. Локальный предпросмотр доступен; полноценный публичный запуск не заявляется.
- Git: репозиторий создан по запросу владельца; commit/push ожидают имени, email автора и URL удаленного репозитория.

- Motion update (user-requested): added one-shot fade/slide reveals, hover lift, animated title gradient and wash, bounded decorative parallax. Native smooth anchors preserved. No-JS content remains visible; system reduced motion and footer toggle disable effects. Browser checked pause/resume, smooth anchors, parallax CSS offset, hover translate around -7 px and no horizontal overflow. Server regression suite 9/9, motion module syntax check passed. This request supersedes the original spec restriction on continuous decorative animation; a pause control is provided.
