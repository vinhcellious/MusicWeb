document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử DOM liên quan đến hồ sơ
    const profileCurrentAvatar = document.getElementById('profile-current-avatar');
    const profileAvatarUpload = document.getElementById('profile-avatar-upload');
    const profileFullNameInput = document.getElementById('profile-full-name');
    const profileEmailInput = document.getElementById('profile-email');
    const profilePhoneInput = document.getElementById('profile-phone');
    const profileDobInput = document.getElementById('profile-dob');
    const saveProfileButton = document.getElementById('save-profile-button');
    const profileMessage = document.getElementById('profile-message');

    // Chỉ chạy logic nếu các phần tử cần thiết tồn tại (trên trang profile.html)
    if (profileCurrentAvatar && saveProfileButton) {
        function loadUserProfile() {
            const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
            if (loggedInUser && loggedInUser.profile) {
                profileFullNameInput.value = loggedInUser.profile.fullName || '';
                profileEmailInput.value = loggedInUser.profile.email || '';
                profilePhoneInput.value = loggedInUser.profile.phone || '';
                profileDobInput.value = loggedInUser.profile.dob || '';
                profileCurrentAvatar.src = loggedInUser.profile.avatar || 'Assets/Images/default-avatar.png';
            } else {
                // Nếu không có người dùng đăng nhập hoặc profile, chuyển hướng về trang chủ hoặc trang đăng nhập
                alert('Vui lòng đăng nhập để truy cập hồ sơ của bạn.');
                window.location.href = 'login.html'; // Hoặc 'index.html'
                return;
            }
            window.displayMessage(profileMessage, '', ''); // Xóa thông báo cũ
        }

        profileAvatarUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // Limit image size to 2MB
                    window.displayMessage(profileMessage, 'Kích thước ảnh quá lớn (tối đa 2MB).', 'error');
                    event.target.value = ''; // Clear selected file
                    // Revert to old avatar if size is too large
                    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
                    profileCurrentAvatar.src = (loggedInUser && loggedInUser.profile && loggedInUser.profile.avatar) ? loggedInUser.profile.avatar : 'Assets/Images/default-avatar.png';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    profileCurrentAvatar.src = e.target.result; // Display image preview
                    window.displayMessage(profileMessage, '', ''); // Clear error message
                };
                reader.onerror = () => {
                    window.displayMessage(profileMessage, 'Không thể đọc file ảnh. Vui lòng thử lại.', 'error');
                    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
                    profileCurrentAvatar.src = (loggedInUser && loggedInUser.profile && loggedInUser.profile.avatar) ? loggedInUser.profile.avatar : 'Assets/Images/default-avatar.png';
                };
                reader.readAsDataURL(file); // Read file as Base64
            }
        });

        saveProfileButton.addEventListener('click', () => {
            let loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

            if (!loggedInUser) {
                window.displayMessage(profileMessage, 'Bạn chưa đăng nhập.', 'error');
                return;
            }

            if (!loggedInUser.profile) {
                loggedInUser.profile = {};
            }

            const newFullName = profileFullNameInput.value.trim();
            const newEmail = profileEmailInput.value.trim();
            const newPhone = profilePhoneInput.value.trim();
            const newDob = profileDobInput.value;
            const newAvatar = profileCurrentAvatar.src;

            loggedInUser.profile.fullName = newFullName;
            loggedInUser.profile.email = newEmail;
            loggedInUser.profile.phone = newPhone;
            loggedInUser.profile.dob = newDob;
            loggedInUser.profile.avatar = newAvatar;

            let users = [];
            try {
                users = JSON.parse(localStorage.getItem('users')) || [];
            } catch (e) {
                console.error('Lỗi khi đọc người dùng từ localStorage:', e);
                users = [];
            }

            const userIndex = users.findIndex(user => user.username === loggedInUser.username);

            if (userIndex !== -1) {
                users[userIndex] = loggedInUser;
                try {
                    localStorage.setItem('users', JSON.stringify(users));
                    sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                    window.displayMessage(profileMessage, 'Hồ sơ đã được cập nhật thành công!', 'success');
                    window.updateAuthUI(); // Cập nhật avatar/username trên header nếu có
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Quay về trang chủ sau khi lưu
                    }, 1500);
                } catch (e) {
                    console.error('Lỗi khi lưu vào LocalStorage:', e);
                    window.displayMessage(profileMessage, 'Lỗi khi lưu hồ sơ. Có thể dữ liệu quá lớn.', 'error');
                }
            } else {
                window.displayMessage(profileMessage, 'Lỗi: Không tìm thấy người dùng để cập nhật. Vui lòng đăng nhập lại.', 'error');
                console.error('Lỗi cập nhật hồ sơ: Không tìm thấy người dùng trong LocalStorage.');
            }
        });

        // Tải hồ sơ khi trang profile được load
        loadUserProfile();
    }
});