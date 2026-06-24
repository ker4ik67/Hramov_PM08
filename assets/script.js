// ============================================
// COMMIT 1: Инициализация проекта, утилиты, хранилище
// ============================================

/**
 * Утилиты
 */
const utils = {
    // Генерация уникального ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Форматирование даты
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU');
    },

    // Форматирование даты-времени
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleString('ru-RU');
    },

    // Экранирование HTML для безопасности
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Валидация email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Валидация телефона
    isValidPhone(phone) {
        return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
    },

    // Валидация логина (латиница + цифры, мин 6 символов)
    isValidLogin(login) {
        return /^[a-zA-Z0-9]{6,}$/.test(login);
    }
};

/**
 * Хранилище данных (localStorage)
 */
const storage = {
    KEYS: {
        USERS: 'users',
        REQUESTS: 'requests',
        CURRENT_USER: 'currentUser'
    },

    // Инициализация начальных данных
    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            // Админ по умолчанию
            const defaultUsers = [
                {
                    login: 'Admin26',
                    password: 'Demo20',
                    fullName: 'Администратор',
                    phone: '+7 (495) 123-45-67',
                    email: 'admin@uchusvseti.ru',
                    role: 'admin'
                }
            ];
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(defaultUsers));
        }
        if (!localStorage.getItem(this.KEYS.REQUESTS)) {
            localStorage.setItem(this.KEYS.REQUESTS, JSON.stringify([]));
        }
    },

    getUsers() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    },

    saveUsers(users) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    getRequests() {
        return JSON.parse(localStorage.getItem(this.KEYS.REQUESTS) || '[]');
    },

    saveRequests(requests) {
        localStorage.setItem(this.KEYS.REQUESTS, JSON.stringify(requests));
    },

    getCurrentUser() {
        const data = localStorage.getItem(this.KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },

    setCurrentUser(user) {
        if (user) {
            localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.KEYS.CURRENT_USER);
        }
    }
};

// ============================================
// COMMIT 2: Toast-уведомления
// ============================================

const toast = {
    container: document.getElementById('toastContainer'),

    show(message, type = 'success') {
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toastEl.innerHTML = `
                    <i class="fas ${icons[type] || icons.success}"></i>
                    <span>${utils.escapeHtml(message)}</span>
                `;

        this.container.appendChild(toastEl);

        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            toastEl.classList.add('hiding');
            setTimeout(() => {
                toastEl.remove();
            }, 300);
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// ============================================
// COMMIT 3: Роутинг (SPA)
// ============================================

const router = {
    currentPage: '',

    routes: {
        login: { page: 'login', auth: false },
        register: { page: 'register', auth: false },
        dashboard: { page: 'dashboard', auth: true },
        apply: { page: 'apply', auth: true },
        admin: { page: 'admin', auth: true, admin: true }
    },

    init() {
        // Обработка изменения hash
        window.addEventListener('hashchange', () => this.handleRoute());

        // Первоначальная загрузка
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.replace('#/', '') || '';
        const routeName = hash || 'login';
        const route = this.routes[routeName];

        if (!route) {
            this.navigate('login');
            return;
        }

        const currentUser = storage.getCurrentUser();

        // Проверка авторизации
        if (route.auth && !currentUser) {
            this.navigate('login');
            return;
        }

        // Проверка прав админа
        if (route.admin && (!currentUser || currentUser.role !== 'admin')) {
            this.navigate('dashboard');
            toast.error('Доступ запрещён. Требуются права администратора.');
            return;
        }

        // Если неавторизованный пытается попасть на защищённую страницу
        if (!route.auth && currentUser && (routeName === 'login' || routeName === 'register')) {
            this.navigate('dashboard');
            return;
        }

        this.showPage(routeName);
    },

    showPage(pageName) {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('page-active');
        });

        // Показываем нужную страницу
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('page-active');
        }

        this.currentPage = pageName;

        // Обновляем навигацию
        this.updateNav();

        // Обновляем видимость шапки
        this.updateHeader();

        // Инициализация страницы
        this.initPage(pageName);

        // Закрываем мобильное меню
        closeMobileMenu();

        // Скролл вверх
        window.scrollTo(0, 0);
    },

    navigate(pageName) {
        window.location.hash = `/${pageName}`;
    },

    updateNav() {
        const currentUser = storage.getCurrentUser();

        // Обновляем активные ссылки
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.classList.toggle('active', link.dataset.page === this.currentPage);
        });

        // Показываем/скрываем ссылку админа
        const adminLinks = [
            document.getElementById('adminNavLink'),
            document.getElementById('adminMobileLink')
        ];
        adminLinks.forEach(link => {
            if (link) {
                link.classList.toggle('hidden', !(currentUser && currentUser.role === 'admin'));
            }
        });
    },

    updateHeader() {
        const currentUser = storage.getCurrentUser();
        const header = document.querySelector('.header');

        if (!currentUser && (this.currentPage === 'login' || this.currentPage === 'register')) {
            // На страницах авторизации шапка видна, но упрощённая
        }
    },

    initPage(pageName) {
        const currentUser = storage.getCurrentUser();

        switch (pageName) {
            case 'dashboard':
                if (currentUser) {
                    document.getElementById('welcomeTitle').textContent =
                        `Здравствуйте, ${currentUser.fullName}!`;
                }
                slider.init();
                requests.renderUserRequests();
                break;

            case 'admin':
                admin.renderStats();
                admin.renderRequests();
                break;

            case 'apply':
                // Установить минимальную дату — сегодня
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('applyStartDate').setAttribute('min', today);
                break;

            case 'login':
                // Очистить форму
                document.getElementById('loginForm').reset();
                hideAllErrors();
                break;

            case 'register':
                document.getElementById('registerForm').reset();
                hideAllErrors();
                break;
        }
    }
};

// ============================================
// COMMIT 4: Аутентификация
// ============================================

const auth = {
    // Регистрация
    register(event) {
        event.preventDefault();

        const login = document.getElementById('regLogin').value.trim();
        const password = document.getElementById('regPassword').value;
        const fullName = document.getElementById('regFullName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const email = document.getElementById('regEmail').value.trim();

        // Сброс ошибок
        hideAllErrors();

        // Валидация
        let hasError = false;

        if (!utils.isValidLogin(login)) {
            showError('regLogin', 'Логин должен содержать минимум 6 символов (латиница и цифры)');
            hasError = true;
        }

        if (password.length < 8) {
            showError('regPassword', 'Пароль должен содержать минимум 8 символов');
            hasError = true;
        }

        if (!fullName) {
            showError('regFullName', 'Введите ФИО');
            hasError = true;
        }

        if (email && !utils.isValidEmail(email)) {
            showError('regEmail', 'Введите корректный email');
            hasError = true;
        }

        if (hasError) {
            toast.error('Исправьте ошибки в форме');
            return;
        }

        // Проверка уникальности логина
        const users = storage.getUsers();
        if (users.find(u => u.login === login)) {
            showError('regLogin', 'Пользователь с таким логином уже существует');
            toast.error('Логин уже занят');
            return;
        }

        // Создание пользователя
        const newUser = {
            login,
            password,
            fullName,
            phone,
            email,
            role: 'user'
        };

        users.push(newUser);
        storage.saveUsers(users);

        toast.success('Регистрация прошла успешно! Теперь вы можете войти.');
        router.navigate('login');
    },

    // Авторизация
    login(event) {
        event.preventDefault();

        const login = document.getElementById('loginLogin').value.trim();
        const password = document.getElementById('loginPassword').value;

        hideAllErrors();

        if (!login || !password) {
            toast.error('Введите логин и пароль');
            return;
        }

        // Проверка админа
        if (login === 'Admin26' && password === 'Demo20') {
            const adminUser = {
                login: 'Admin26',
                fullName: 'Администратор',
                role: 'admin'
            };
            storage.setCurrentUser(adminUser);
            toast.success('Добро пожаловать, Администратор!');
            router.navigate('admin');
            return;
        }

        // Проверка обычного пользователя
        const users = storage.getUsers();
        const user = users.find(u => u.login === login && u.password === password);

        if (!user) {
            toast.error('Неверный логин или пароль');
            return;
        }

        storage.setCurrentUser(user);
        toast.success(`Добро пожаловать, ${user.fullName}!`);
        router.navigate('dashboard');
    },

    // Выход
    logout() {
        storage.setCurrentUser(null);
        toast.info('Вы вышли из системы');
        router.navigate('login');
    }
};

// ============================================
// COMMIT 5: Валидация полей
// ============================================

function validateField(fieldId) {
    const el = document.getElementById(fieldId);
    const value = el.value.trim();
    const errorEl = document.getElementById(fieldId + 'Error');

    let error = '';

    switch (fieldId) {
        case 'regLogin':
            if (value && !utils.isValidLogin(value)) {
                error = 'Минимум 6 символов (латиница + цифры)';
            }
            break;
        case 'regPassword':
            if (value && value.length < 8) {
                error = 'Минимум 8 символов';
            }
            break;
        case 'regFullName':
            if (value && value.length < 3) {
                error = 'Введите полное ФИО';
            }
            break;
        case 'regEmail':
            if (value && !utils.isValidEmail(value)) {
                error = 'Некорректный email';
            }
            break;
    }

    if (error) {
        el.classList.add('error');
        errorEl.textContent = error;
        errorEl.classList.add('show');
    } else {
        el.classList.remove('error');
        errorEl.classList.remove('show');
    }
}

function showError(fieldId, message) {
    const el = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    el.classList.add('error');
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function hideAllErrors() {
    document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

// ============================================
// COMMIT 6: Слайдер
// ============================================

const slider = {
    currentSlide: 0,
    slides: [],
    dots: [],
    autoPlayInterval: null,
    autoPlayDelay: 3000,

    init() {
        const sliderEl = document.getElementById('dashboardSlider');
        if (!sliderEl) return;

        this.slides = sliderEl.querySelectorAll('.slide');
        this.currentSlide = 0;

        // Создать точки
        const dotsContainer = document.getElementById('sliderDots');
        dotsContainer.innerHTML = '';
        this.dots = [];

        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
            dot.onclick = () => this.goTo(index);
            dotsContainer.appendChild(dot);
            this.dots.push(dot);
        });

        // Показать первый слайд
        this.updateSlides();

        // Запустить автоплей
        this.startAutoPlay();

        // Пауза при наведении
        sliderEl.addEventListener('mouseenter', () => this.stopAutoPlay());
        sliderEl.addEventListener('mouseleave', () => this.startAutoPlay());
    },

    updateSlides() {
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    },

    goTo(index) {
        this.currentSlide = index;
        this.updateSlides();
    },

    next() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlides();
    },

    prev() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlides();
    },

    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
    },

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
};

// ============================================
// COMMIT 7: Заявки (CRUD)
// ============================================

const requests = {
    // Подача заявки
    submit(event) {
        event.preventDefault();

        const currentUser = storage.getCurrentUser();
        if (!currentUser) {
            toast.error('Необходимо авторизоваться');
            router.navigate('login');
            return;
        }

        const course = document.getElementById('applyCourse').value;
        const startDate = document.getElementById('applyStartDate').value;
        const payment = document.getElementById('applyPayment').value;

        if (!course || !startDate || !payment) {
            toast.error('Заполните все обязательные поля');
            return;
        }

        const newRequest = {
            id: utils.generateId(),
            userLogin: currentUser.login,
            course,
            startDate,
            payment,
            status: 'Новая',
            review: null,
            createdAt: new Date().toISOString()
        };

        const allRequests = storage.getRequests();
        allRequests.push(newRequest);
        storage.saveRequests(allRequests);

        toast.success('Заявка успешно создана!');
        document.getElementById('applyForm').reset();
        router.navigate('dashboard');
    },

    // Получить заявки текущего пользователя
    getUserRequests() {
        const currentUser = storage.getCurrentUser();
        if (!currentUser) return [];
        return storage.getRequests().filter(r => r.userLogin === currentUser.login);
    },

    // Отрисовать заявки пользователя
    renderUserRequests() {
        const container = document.getElementById('requestsList');
        const userRequests = this.getUserRequests();

        if (userRequests.length === 0) {
            container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>У вас пока нет заявок. <a href="#/apply" onclick="router.navigate('apply'); return false;">Подайте первую заявку</a>!</p>
                        </div>
                    `;
            return;
        }

        // Сортируем по дате создания (новые сверху)
        const sorted = [...userRequests].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        container.innerHTML = '<div class="requests-list">' +
            sorted.map(req => this.renderRequestCard(req)).join('') +
            '</div>';
    },

    renderRequestCard(req) {
        const statusClass = req.status === 'Новая' ? 'status-new' :
            req.status === 'Идёт обучение' ? 'status-progress' : 'status-completed';

        const badgeClass = req.status === 'Новая' ? 'badge-info' :
            req.status === 'Идёт обучение' ? 'badge-warning' : 'badge-success';

        const statusIcon = req.status === 'Новая' ? 'fa-clock' :
            req.status === 'Идёт обучение' ? 'fa-spinner fa-spin' : 'fa-check-circle';

        let reviewHtml = '';
        if (req.review) {
            reviewHtml = `
                        <div class="review-card">
                            <div class="review-text">${utils.escapeHtml(req.review.text)}</div>
                            <div class="review-date">
                                <i class="fas fa-calendar"></i> ${utils.formatDateTime(req.review.date)}
                            </div>
                        </div>
                    `;
        }

        const showReviewBtn = req.status === 'Обучение завершено' && !req.review;

        return `
                    <div class="request-item ${statusClass} fade-in">
                        <div class="request-header">
                            <div>
                                <div class="request-title">${utils.escapeHtml(req.course)}</div>
                                <div class="request-meta">
                                    <span><i class="fas fa-calendar"></i> Старт: ${utils.formatDate(req.startDate)}</span>
                                    <span><i class="fas fa-credit-card"></i> ${utils.escapeHtml(req.payment)}</span>
                                    <span><i class="fas fa-hashtag"></i> №${req.id.substr(-6)}</span>
                                </div>
                            </div>
                            <span class="badge ${badgeClass}">
                                <i class="fas ${statusIcon}"></i> ${req.status}
                            </span>
                        </div>
                        ${reviewHtml}
                        ${showReviewBtn ? `
                            <button class="btn btn-outline btn-sm mt-16" onclick="requests.openReviewModal('${req.id}')">
                                <i class="fas fa-comment"></i> Оставить отзыв
                            </button>
                        ` : ''}
                    </div>
                `;
    },

    // Открыть модальное окно отзыва
    openReviewModal(requestId) {
        document.getElementById('reviewRequestId').value = requestId;
        document.getElementById('reviewText').value = '';
        document.getElementById('reviewModal').classList.add('active');
    },

    // Закрыть модальное окно отзыва
    closeReviewModal() {
        document.getElementById('reviewModal').classList.remove('active');
    },

    // Отправить отзыв
    submitReview(event) {
        event.preventDefault();

        const requestId = document.getElementById('reviewRequestId').value;
        const text = document.getElementById('reviewText').value.trim();

        if (!text) {
            toast.error('Введите текст отзыва');
            return;
        }

        const allRequests = storage.getRequests();
        const req = allRequests.find(r => r.id === requestId);

        if (!req) {
            toast.error('Заявка не найдена');
            return;
        }

        req.review = {
            text,
            date: new Date().toISOString()
        };

        storage.saveRequests(allRequests);

        this.closeReviewModal();
        toast.success('Отзыв успешно отправлен!');
        this.renderUserRequests();
    }
};

// ============================================
// COMMIT 8: Админ-панель
// ============================================

const admin = {
    currentPage: 1,
    itemsPerPage: 5,

    // Отрисовать статистику
    renderStats() {
        const allRequests = storage.getRequests();
        const newCount = allRequests.filter(r => r.status === 'Новая').length;
        const progressCount = allRequests.filter(r => r.status === 'Идёт обучение').length;
        const completedCount = allRequests.filter(r => r.status === 'Обучение завершено').length;

        document.getElementById('statTotal').textContent = allRequests.length;
        document.getElementById('statNew').textContent = newCount;
        document.getElementById('statProgress').textContent = progressCount;
        document.getElementById('statCompleted').textContent = completedCount;
    },

    // Получить отфильтрованные заявки
    getFilteredRequests() {
        const statusFilter = document.getElementById('adminFilterStatus').value;
        const searchQuery = document.getElementById('adminSearch').value.trim().toLowerCase();

        let filtered = storage.getRequests();

        // Фильтр по статусу
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        // Поиск по ФИО
        if (searchQuery) {
            const users = storage.getUsers();
            filtered = filtered.filter(r => {
                const user = users.find(u => u.login === r.userLogin);
                const fullName = user ? user.fullName.toLowerCase() : '';
                return fullName.includes(searchQuery);
            });
        }

        return filtered;
    },

    // Отрисовать таблицу заявок
    renderRequests() {
        const tbody = document.getElementById('adminRequestsTable');
        const allRequests = this.getFilteredRequests();

        // Сортировка по дате (новые сверху)
        const sorted = [...allRequests].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Пагинация
        const totalPages = Math.ceil(sorted.length / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const paginated = sorted.slice(start, start + this.itemsPerPage);

        const users = storage.getUsers();

        if (paginated.length === 0) {
            tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
                                <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
                                Заявки не найдены
                            </td>
                        </tr>
                    `;
        } else {
            tbody.innerHTML = paginated.map(req => {
                const user = users.find(u => u.login === req.userLogin);
                const userName = user ? user.fullName : req.userLogin;

                const badgeClass = req.status === 'Новая' ? 'badge-info' :
                    req.status === 'Идёт обучение' ? 'badge-warning' : 'badge-success';

                const statusIcon = req.status === 'Новая' ? 'fa-clock' :
                    req.status === 'Идёт обучение' ? 'fa-spinner fa-spin' : 'fa-check-circle';

                const canProgress = req.status === 'Новая';
                const canComplete = req.status === 'Идёт обучение';

                return `
                            <tr>
                                <td>№${req.id.substr(-6)}</td>
                                <td>${utils.escapeHtml(userName)}</td>
                                <td>${utils.escapeHtml(req.course)}</td>
                                <td>${utils.formatDate(req.startDate)}</td>
                                <td>${utils.escapeHtml(req.payment)}</td>
                                <td>
                                    <span class="badge ${badgeClass}">
                                        <i class="fas ${statusIcon}"></i> ${req.status}
                                    </span>
                                </td>
                                <td>
                                    ${canProgress ? `
                                        <button class="btn btn-warning btn-sm" onclick="admin.updateStatus('${req.id}', 'Идёт обучение')">
                                            <i class="fas fa-play"></i> В обучение
                                        </button>
                                    ` : ''}
                                    ${canComplete ? `
                                        <button class="btn btn-success btn-sm" onclick="admin.updateStatus('${req.id}', 'Обучение завершено')">
                                            <i class="fas fa-check"></i> Завершить
                                        </button>
                                    ` : ''}
                                    ${!canProgress && !canComplete ? `
                                        <span style="color: var(--text-muted); font-size: 12px;">
                                            <i class="fas fa-lock"></i> Завершено
                                        </span>
                                    ` : ''}
                                </td>
                            </tr>
                        `;
            }).join('');
        }

        // Отрисовать пагинацию
        this.renderPagination(totalPages);
    },

    // Обновить статус заявки
    updateStatus(requestId, newStatus) {
        const allRequests = storage.getRequests();
        const req = allRequests.find(r => r.id === requestId);

        if (!req) {
            toast.error('Заявка не найдена');
            return;
        }

        req.status = newStatus;
        storage.saveRequests(allRequests);

        toast.success(`Статус заявки №${requestId.substr(-6)} изменён на "${newStatus}"`);
        this.renderStats();
        this.renderRequests();
    },

    // Отрисовать пагинацию
    renderPagination(totalPages) {
        const container = document.getElementById('adminPagination');

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Кнопка "Назад"
        html += `
                    <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''}
                        onclick="admin.goToPage(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                `;

        // Номера страниц
        for (let i = 1; i <= totalPages; i++) {
            html += `
                        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
                            onclick="admin.goToPage(${i})">${i}</button>
                    `;
        }

        // Кнопка "Вперёд"
        html += `
                    <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''}
                        onclick="admin.goToPage(${this.currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;

        // Информация
        const allRequests = this.getFilteredRequests();
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, allRequests.length);
        html += `<span class="pagination-info">${start}–${end} из ${allRequests.length}</span>`;

        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderRequests();
    }
};