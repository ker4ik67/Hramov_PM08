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
