document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const authOverlay = document.getElementById('auth-overlay');
    const profileOverlay = document.getElementById('profile-overlay');

    // Hàm tiện ích để hiển thị/ẩn overlay
    window.showOverlay = (overlayElement, formToShowId = null, formToHideId = null) => {
        // Ẩn tất cả các overlay khác
        document.querySelectorAll('.overlay').forEach(overlay => {
            if (overlay !== overlayElement) {
                overlay.classList.add('hidden');
            }
        });

        overlayElement.classList.remove('hidden');
        body.classList.add('no-scroll');

        // Logic để hiển thị form cụ thể trong auth-overlay
        if (overlayElement === authOverlay) {
            const registerFormContainer = document.getElementById('register-form-container');
            const loginFormContainer = document.getElementById('login-form-container');

            if (registerFormContainer && loginFormContainer) {
                if (formToShowId === 'register') {
                    registerFormContainer.classList.remove('hidden');
                    loginFormContainer.classList.add('hidden');
                } else if (formToShowId === 'login') {
                    loginFormContainer.classList.remove('hidden');
                    registerFormContainer.classList.add('hidden');
                }
                // Clear messages when showing
                document.getElementById('register-message').textContent = '';
                document.getElementById('login-message').textContent = '';
                document.getElementById('register-message').classList.remove('success', 'error');
                document.getElementById('login-message').classList.remove('success', 'error');
            }
        }
    };

    window.hideOverlay = () => {
        authOverlay.classList.add('hidden');
        profileOverlay.classList.add('hidden');
        body.classList.remove('no-scroll');
    };

    // Hàm tiện ích để hiển thị thông báo
    window.displayMessage = (element, message, type) => {
        element.textContent = message;
        element.classList.remove('success', 'error');
        element.classList.add(type);
    };

    // Đóng overlay khi click ra ngoài form
    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) {
                window.hideOverlay();
            }
        });
    }
    if (profileOverlay) {
        profileOverlay.addEventListener('click', (e) => {
            if (e.target === profileOverlay) {
                window.hideOverlay();
            }
        });
    }

    // Các phần khởi tạo khác sẽ được gọi từ các file JS riêng biệt
    // (ví dụ: initVideoControls(), initAuth(), initProfile())
});