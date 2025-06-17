document.addEventListener('DOMContentLoaded', () => {
    // Register elements
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const isAdminRegisterCheckbox = document.getElementById('is-admin-register');
    const registerSubmitButton = document.getElementById('register-submit-button');
    const registerMessage = document.getElementById('register-message');

    // Login elements
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginSubmitButton = document.getElementById('login-submit-button');
    const loginMessage = document.getElementById('login-message');

    // --- Chức năng Đăng ký (chỉ hoạt động trên register.html) ---
    if (registerSubmitButton) {
        registerSubmitButton.addEventListener('click', () => {
            const username = registerUsernameInput.value.trim();
            const password = registerPasswordInput.value;
            const confirmPassword = registerConfirmPasswordInput.value;
            const isAdmin = isAdminRegisterCheckbox.checked;

            if (!username || !password || !confirmPassword) {
                window.displayMessage(registerMessage, 'Vui lòng điền đầy đủ thông tin.', 'error');
                return;
            }
            if (password !== confirmPassword) {
                window.displayMessage(registerMessage, 'Mật khẩu xác nhận không khớp.', 'error');
                return;
            }
            if (password.length < 6) {
                window.displayMessage(registerMessage, 'Mật khẩu phải có ít nhất 6 ký tự.', 'error');
                return;
            }

            let users = [];
            try {
                users = JSON.parse(localStorage.getItem('users')) || [];
            } catch (e) {
                console.error('Lỗi khi đọc người dùng từ localStorage:', e);
                users = [];
            }

            const userExists = users.some(user => user.username === username);
            if (userExists) {
                window.displayMessage(registerMessage, 'Tài khoản đã tồn tại. Vui lòng chọn tài khoản khác.', 'error');
                return;
            }

            const newUser = {
                username: username,
                password: password,
                isAdmin: isAdmin,
                profile: {
                    fullName: '',
                    email: '',
                    phone: '',
                    dob: '',
                    avatar: 'Assets/Images/default-avatar.png'
                }
            };
            users.push(newUser);

            try {
                localStorage.setItem('users', JSON.stringify(users));
                window.displayMessage(registerMessage, 'Đăng ký thành công! Bạn có thể đăng nhập ngay.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html'; // Chuyển hướng sang trang đăng nhập
                }, 2000);
            } catch (e) {
                console.error('Lỗi khi lưu người dùng vào localStorage:', e);
                window.displayMessage(registerMessage, 'Lỗi khi đăng ký. Vui lòng thử lại.', 'error');
            }
        });
    }

    // --- Chức năng Đăng nhập (chỉ hoạt động trên login.html) ---
    if (loginSubmitButton) {
        loginSubmitButton.addEventListener('click', () => {
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;

            if (!username || !password) {
                window.displayMessage(loginMessage, 'Vui lòng điền đầy đủ thông tin đăng nhập.', 'error');
                return;
            }

            let users = [];
            try {
                users = JSON.parse(localStorage.getItem('users')) || [];
            } catch (e) {
                console.error('Lỗi khi đọc người dùng từ localStorage:', e);
                users = [];
            }

            const foundUser = users.find(user => user.username === username && user.password === password);

            if (foundUser) {
                window.displayMessage(loginMessage, 'Đăng nhập thành công!', 'success');
                sessionStorage.setItem('loggedInUser', JSON.stringify(foundUser));
                // Cập nhật UI và chuyển hướng về trang chủ
                window.location.href = 'index.html';
            } else {
                window.displayMessage(loginMessage, 'Tài khoản hoặc mật khẩu không đúng.', 'error');
            }
        });
    }
});