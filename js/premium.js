// js/premium.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Chức năng FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling; // Lấy phần tử kế tiếp (faq-answer)

            // Chuyển đổi class active trên nút câu hỏi
            question.classList.toggle('active');

            // Chuyển đổi hiển thị của câu trả lời
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null; // Thu gọn
                answer.style.padding = '0 20px'; // Bỏ padding khi thu gọn
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px'; // Mở rộng hết cỡ
                answer.style.padding = '0 20px 20px'; // Thêm padding dưới khi mở rộng
            }
        });
    });

    // --- Cuộn mượt mà cho các liên kết điều hướng ---
    document.querySelectorAll('.premium-nav a[href^="#"], .hero-section .cta-button[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- Logic cho Modal Thanh toán ---
    const paymentModal = document.getElementById('payment-modal');
    const closeModalButton = document.querySelector('.modal .close-button');
    const modalPlanName = document.getElementById('modal-plan-name');

    const paymentOptionButtons = document.querySelectorAll('.payment-option-button');
    const qrPaymentSection = document.getElementById('qr-payment-section');
    const bankPaymentSection = document.getElementById('bank-payment-section');

    const qrCodeImage = document.getElementById('qr-code-image');
    const qrAmount = document.getElementById('qr-amount');
    const qrContent = document.getElementById('qr-content');

    const bankName = document.getElementById('bank-name');
    const bankAccountNumber = document.getElementById('bank-account-number');
    const bankAccountHolder = document.getElementById('bank-account-holder');
    const bankAmount = document.getElementById('bank-amount');
    const bankContent = document.getElementById('bank-content');

    const copyButtons = document.querySelectorAll('.copy-button');
    const completePaymentButton = document.querySelector('.complete-payment-button');

    // Dữ liệu mẫu để tạo ngẫu nhiên (trong ứng dụng thực tế, bạn sẽ lấy từ backend)
    const bankList = [
        { name: "Vietcombank", holder: "NGUYEN VAN A" },
        { name: "Techcombank", holder: "TRAN THI B" },
        { name: "ACB", holder: "LE VAN C" },
        { name: "MB Bank", holder: "PHẠM THỊ D" },
        { name: "VPBank", holder: "HOANG VAN E" }
    ];

    const prices = {
        'Premium Cá nhân': 5.99,
        'Premium Gia đình': 9.99,
        'Premium Sinh viên': 2.99
    };

    /**
     * Tạo một số tài khoản ngân hàng ngẫu nhiên.
     * @returns {string} Một số gồm 10 chữ số ngẫu nhiên.
     */
    function generateRandomAccountNumber() {
        let accountNumber = '';
        for (let i = 0; i < 10; i++) {
            accountNumber += Math.floor(Math.random() * 10);
        }
        return accountNumber;
    }

    /**
     * Tạo một chuỗi nội dung thanh toán duy nhất.
     * @param {string} planName - Tên của gói đã chọn.
     * @returns {string} Chuỗi nội dung thanh toán.
     */
    function generatePaymentContent(planName) {
        const timestamp = Date.now().toString().slice(-6); // 6 chữ số cuối của timestamp
        const randomNum = Math.floor(Math.random() * 1000);
        // Thay thế "Spotify" bằng "Vinhcellious" nếu bạn muốn tên app của mình trong nội dung
        return `VINC.${planName.replace(/\s/g, '').toUpperCase()}.${timestamp}${randomNum}`;
    }

    /**
     * Hiển thị modal thanh toán với chi tiết cho gói đã chọn.
     * @param {string} planName - Tên của gói được chọn.
     */
    function showPaymentModal(planName) {
        const amount = prices[planName] || 0; // Lấy giá từ đối tượng prices
        const paymentContent = generatePaymentContent(planName);

        modalPlanName.textContent = planName;

        // Đặt thông tin thanh toán QR
        // Trong ứng dụng thực, mã QR sẽ được tạo bởi API backend (ví dụ: VietQR API)
        // Hiện tại, chúng ta chỉ cập nhật văn bản và sử dụng ảnh placeholder
        qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Transfer ${amount.toFixed(2)} USD to Vinhcellious Premium for ${paymentContent}`)}`;
        qrAmount.textContent = `${amount.toFixed(2)} USD`;
        qrContent.textContent = paymentContent;

        // Đặt thông tin chuyển khoản ngân hàng
        const randomBank = bankList[Math.floor(Math.random() * bankList.length)];
        bankName.textContent = randomBank.name;
        bankAccountNumber.textContent = generateRandomAccountNumber();
        bankAccountHolder.textContent = randomBank.holder;
        bankAmount.textContent = `${amount.toFixed(2)} USD`;
        bankContent.textContent = paymentContent;

        // Mặc định hiển thị tab QR
        paymentOptionButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.payment-option-button[data-method="qr"]').classList.add('active');
        qrPaymentSection.classList.add('active');
        bankPaymentSection.classList.remove('active');

        paymentModal.style.display = 'flex'; // Hiển thị modal
    }

    // Lắng nghe sự kiện cho các nút "Chọn gói"
    const selectPlanButtons = document.querySelectorAll('.select-plan-button');
    selectPlanButtons.forEach(button => {
        button.addEventListener('click', () => {
            const planName = button.closest('.plan-card').querySelector('h3').textContent;
            showPaymentModal(planName);
        });
    });

    // Lắng nghe sự kiện đóng modal
    closeModalButton.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    // Đóng modal nếu click bên ngoài nội dung modal
    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
    });

    // Lắng nghe sự kiện cho các nút tùy chọn thanh toán (QR / Chuyển khoản)
    paymentOptionButtons.forEach(button => {
        button.addEventListener('click', () => {
            paymentOptionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const method = button.dataset.method;
            if (method === 'qr') {
                qrPaymentSection.classList.add('active');
                bankPaymentSection.classList.remove('active');
            } else {
                qrPaymentSection.classList.remove('active');
                bankPaymentSection.classList.add('active');
            }
        });
    });

    // Lắng nghe sự kiện cho các nút sao chép
    copyButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;

            try {
                await navigator.clipboard.writeText(textToCopy);
                button.innerHTML = '<i class="fas fa-check"></i> Đã sao chép!';
                setTimeout(() => {
                    button.innerHTML = '<i class="far fa-copy"></i>';
                }, 2000);
            } catch (err) {
                console.error('Không thể sao chép văn bản:', err);
                alert('Không thể sao chép. Vui lòng sao chép thủ công.');
            }
        });
    });

    // Lắng nghe sự kiện cho nút "Tôi đã chuyển khoản"
    completePaymentButton.addEventListener('click', () => {
        alert('Cảm ơn bạn! Yêu cầu thanh toán của bạn đã được ghi nhận và đang chờ xử lý.');
        // Trong ứng dụng thực tế, bạn sẽ:
        // 1. Gửi yêu cầu đến backend để đánh dấu thanh toán là "đang chờ"
        // 2. Ẩn modal
        // 3. Có thể hiển thị thông báo thành công hoặc chuyển hướng người dùng.
        paymentModal.style.display = 'none';
    });
});