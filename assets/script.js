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