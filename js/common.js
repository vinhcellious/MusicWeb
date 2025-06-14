document.addEventListener('DOMContentLoaded', () => {
    const authButtonsContainer = document.getElementById('auth-buttons');
    const userProfileContainer = document.getElementById('user-profile');
    const displayUsernameSpan = document.getElementById('display-username');
    const headerUserAvatar = document.getElementById('header-user-avatar');
    const logoutButton = document.getElementById('logout-button');
    const profileDropdown = userProfileContainer ? userProfileContainer.querySelector('.profile-dropdown') : null;

    // Hàm tiện ích để hiển thị thông báo (vẫn giữ để các trang dùng chung)
    window.displayMessage = (element, message, type) => {
        if (element) { // Check if element exists before trying to modify
            element.textContent = message;
            element.classList.remove('success', 'error');
            element.classList.add(type);
        }
    };

    // Hàm cập nhật UI sau khi đăng nhập/đăng xuất (đặt trong window để global)
    window.updateAuthUI = () => {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (loggedInUser) {
            if (authButtonsContainer) authButtonsContainer.classList.add('hidden');
            if (userProfileContainer) userProfileContainer.classList.remove('hidden');
            if (displayUsernameSpan) displayUsernameSpan.textContent = loggedInUser.username;
            if (headerUserAvatar) headerUserAvatar.src = (loggedInUser.profile && loggedInUser.profile.avatar) ? loggedInUser.profile.avatar : 'Assets/Images/default-avatar.png';

            if (userProfileContainer && loggedInUser.isAdmin) {
                userProfileContainer.querySelector('.user-greeting').style.color = 'var(--admin-gold)';
            } else if (userProfileContainer) {
                userProfileContainer.querySelector('.user-greeting').style.color = 'var(--white)';
            }
        } else {
            if (authButtonsContainer) authButtonsContainer.classList.remove('hidden');
            if (userProfileContainer) userProfileContainer.classList.add('hidden');
            if (displayUsernameSpan) displayUsernameSpan.textContent = '';
            if (headerUserAvatar) headerUserAvatar.src = 'Assets/Images/default-avatar.png';
        }
    };

    // Logic cho dropdown profile (chỉ chạy nếu các phần tử tồn tại)
    if (userProfileContainer) {
        userProfileContainer.addEventListener('click', (e) => {
            if (profileDropdown && (profileDropdown.contains(e.target) || e.target.closest('.profile-dropdown'))) {
                return;
            }
            userProfileContainer.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userProfileContainer.contains(e.target) && userProfileContainer.classList.contains('active')) {
                userProfileContainer.classList.remove('active');
            }
        });
    }

    // Logic đăng xuất (chỉ chạy nếu nút tồn tại)
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            if (userProfileContainer) userProfileContainer.classList.remove('active');
            window.updateAuthUI();
            console.log('Người dùng đã đăng xuất.');
            // Tùy chọn: Chuyển hướng về trang chủ sau khi đăng xuất
            // window.location.href = 'index.html';
        });
    }

    // Kiểm tra trạng thái đăng nhập khi tải trang
    window.updateAuthUI();
});