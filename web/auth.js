// 用户认证系统 JavaScript

// 用户数据存储（实际项目中应使用后端数据库）
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        // 优先从localStorage读取，如果没有则从sessionStorage读取
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null') || 
                          JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        this.init();
    }

    init() {
        // 检查访问控制
        this.checkAccess();
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 初始化密码强度检查
        this.initPasswordStrength();
    }

    // 访问控制检查
    checkAccess() {
        const currentPage = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'register.html'];
        
        // 如果用户已登录且在认证页面，重定向到主页
        if (this.currentUser && authPages.includes(currentPage)) {
            window.location.href = 'index.html';
            return;
        }
        
        // 如果用户未登录且不在认证页面，重定向到登录页
        // 修复：当currentPage为空字符串时（访问根目录），也应该检查登录状态
        if (!this.currentUser && !authPages.includes(currentPage) && (currentPage !== '' || currentPage === 'index.html')) {
            window.location.href = 'login.html';
            return;
        }
        
        // 特别处理：当访问根目录时，如果未登录则重定向到登录页
        if (!this.currentUser && (currentPage === '' || currentPage === 'index.html')) {
            window.location.href = 'login.html';
            return;
        }
    }

    // 绑定事件监听器
    bindEvents() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // 忘记密码表单
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // 密码强度实时检查
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // 确认密码检查
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => this.checkPasswordMatch());
        }

        // 用户名实时验证
        const registerUsername = document.getElementById('registerUsername');
        if (registerUsername) {
            registerUsername.addEventListener('blur', (e) => this.validateUsername(e.target.value));
        }

        // 邮箱实时验证
        const registerEmail = document.getElementById('registerEmail');
        if (registerEmail) {
            registerEmail.addEventListener('blur', (e) => this.validateEmail(e.target.value));
        }
    }

    // 处理登录
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 清除之前的错误信息
        this.clearErrors();

        // 验证输入
        if (!email || !password) {
            this.showError('请填写所有必填字段');
            return;
        }

        // 显示加载状态
        this.showLoading(true);

        try {
            // 模拟网络延迟
            await this.delay(1000);

            // 查找用户
            const user = this.users.find(u => 
                (u.email === email || u.username === email) && u.password === this.hashPassword(password)
            );

            if (!user) {
                this.showError('用户名/邮箱或密码错误');
                return;
            }

            // 登录成功
            this.currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                loginTime: new Date().toISOString()
            };

            // 保存会话
            if (rememberMe) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

            this.showSuccess('登录成功！正在跳转...');
            
            // 跳转到主页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            this.showError('登录失败，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }

    // 处理注册
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // 清除之前的错误信息
        this.clearErrors();

        // 验证输入
        if (!this.validateRegistration(username, email, password, confirmPassword, agreeTerms)) {
            return;
        }

        // 显示加载状态
        this.showLoading(true);

        try {
            // 模拟网络延迟
            await this.delay(1500);

            // 检查用户是否已存在
            const existingUser = this.users.find(u => u.email === email || u.username === username);
            if (existingUser) {
                if (existingUser.email === email) {
                    this.showError('该邮箱已被注册');
                } else {
                    this.showError('该用户名已被使用');
                }
                return;
            }

            // 创建新用户
            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password: this.hashPassword(password),
                createdAt: new Date().toISOString()
            };

            this.users.push(newUser);
            localStorage.setItem('users', JSON.stringify(this.users));

            this.showSuccess('注册成功！正在跳转到登录页面...');
            
            // 跳转到登录页
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            this.showError('注册失败，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }

    // 处理忘记密码
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            this.showError('请输入邮箱地址');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('请输入有效的邮箱地址');
            return;
        }

        this.showLoading(true);

        try {
            // 模拟发送重置邮件
            await this.delay(2000);
            
            const user = this.users.find(u => u.email === email);
            if (user) {
                this.showSuccess('重置链接已发送到您的邮箱，请查收');
            } else {
                this.showError('该邮箱未注册');
            }
            
            this.closeForgotPassword();
        } catch (error) {
            this.showError('发送失败，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }

    // 验证注册信息
    validateRegistration(username, email, password, confirmPassword, agreeTerms) {
        let isValid = true;

        // 验证用户名
        if (!username) {
            this.showFieldError('usernameError', '请输入用户名');
            isValid = false;
        } else if (username.length < 3 || username.length > 20) {
            this.showFieldError('usernameError', '用户名长度应为3-20个字符');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            this.showFieldError('usernameError', '用户名只能包含字母、数字、下划线和中文');
            isValid = false;
        }

        // 验证邮箱
        if (!email) {
            this.showFieldError('emailError', '请输入邮箱地址');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('emailError', '请输入有效的邮箱地址');
            isValid = false;
        }

        // 验证密码
        if (!password) {
            this.showFieldError('passwordError', '请输入密码');
            isValid = false;
        } else if (!this.isStrongPassword(password)) {
            this.showFieldError('passwordError', '密码不符合安全要求');
            isValid = false;
        }

        // 验证确认密码
        if (!confirmPassword) {
            this.showFieldError('confirmPasswordError', '请确认密码');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showFieldError('confirmPasswordError', '两次输入的密码不一致');
            isValid = false;
        }

        // 验证协议同意
        if (!agreeTerms) {
            this.showError('请阅读并同意用户协议和隐私政策');
            isValid = false;
        }

        return isValid;
    }

    // 验证用户名
    validateUsername(username) {
        const errorElement = document.getElementById('usernameError');
        
        if (!username) {
            this.showFieldError('usernameError', '请输入用户名');
            return false;
        }
        
        if (username.length < 3 || username.length > 20) {
            this.showFieldError('usernameError', '用户名长度应为3-20个字符');
            return false;
        }
        
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            this.showFieldError('usernameError', '用户名只能包含字母、数字、下划线和中文');
            return false;
        }

        // 检查用户名是否已存在
        const existingUser = this.users.find(u => u.username === username);
        if (existingUser) {
            this.showFieldError('usernameError', '该用户名已被使用');
            return false;
        }

        this.hideFieldError('usernameError');
        return true;
    }

    // 验证邮箱
    validateEmail(email) {
        if (!email) {
            this.showFieldError('emailError', '请输入邮箱地址');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showFieldError('emailError', '请输入有效的邮箱地址');
            return false;
        }

        // 检查邮箱是否已存在
        const existingUser = this.users.find(u => u.email === email);
        if (existingUser) {
            this.showFieldError('emailError', '该邮箱已被注册');
            return false;
        }

        this.hideFieldError('emailError');
        return true;
    }

    // 初始化密码强度检查
    initPasswordStrength() {
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }
    }

    // 检查密码强度
    checkPasswordStrength(password) {
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        const requirements = {
            length: document.getElementById('lengthReq'),
            uppercase: document.getElementById('uppercaseReq'),
            lowercase: document.getElementById('lowercaseReq'),
            number: document.getElementById('numberReq'),
            special: document.getElementById('specialReq')
        };

        if (!strengthFill || !strengthText || !requirements.length) return;

        // 检查各项要求
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // 更新要求显示
        Object.keys(checks).forEach(key => {
            if (requirements[key]) {
                if (checks[key]) {
                    requirements[key].classList.add('met');
                } else {
                    requirements[key].classList.remove('met');
                }
            }
        });

        // 计算强度
        const score = Object.values(checks).filter(Boolean).length;
        let strength = 'weak';
        let strengthLabel = '弱';

        if (score >= 5) {
            strength = 'strong';
            strengthLabel = '强';
        } else if (score >= 4) {
            strength = 'good';
            strengthLabel = '良好';
        } else if (score >= 2) {
            strength = 'fair';
            strengthLabel = '一般';
        }

        // 更新强度显示
        strengthFill.className = `strength-fill ${strength}`;
        strengthText.textContent = `密码强度：${strengthLabel}`;
    }

    // 检查密码匹配
    checkPasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirmPasswordError', '两次输入的密码不一致');
            return false;
        } else {
            this.hideFieldError('confirmPasswordError');
            return true;
        }
    }

    // 检查密码是否足够强
    isStrongPassword(password) {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /\d/.test(password) &&
               /[!@#$%^&*(),.?":{}|<>]/.test(password);
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 简单的密码哈希（实际项目中应使用更安全的方法）
    hashPassword(password) {
        // 这里使用简单的哈希，实际项目中应使用bcrypt等
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString();
    }

    // 显示错误信息
    showError(message) {
        this.showAlert(message, 'error');
    }

    // 显示成功信息
    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    // 显示提示信息
    showAlert(message, type) {
        // 移除现有的提示
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 创建新的提示
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // 插入到表单前面
        const form = document.querySelector('.auth-form');
        if (form) {
            form.parentNode.insertBefore(alert, form);
            
            // 显示动画
            setTimeout(() => alert.classList.add('show'), 100);
            
            // 自动隐藏
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        }
    }

    // 显示字段错误
    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // 隐藏字段错误
    hideFieldError(fieldId) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // 清除所有错误信息
    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.classList.remove('show');
        });

        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('show');
            } else {
                loadingOverlay.classList.remove('show');
            }
        }
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 登出
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    // 获取当前用户
    getCurrentUser() {
        // 实时检查localStorage和sessionStorage
        const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        this.currentUser = localUser || sessionUser;
        return this.currentUser;
    }
}

// 全局函数
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showTerms() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeTerms() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showPrivacy() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closePrivacy() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 初始化认证系统
const authSystem = new AuthSystem();

// 导出给其他脚本使用
window.authSystem = authSystem;