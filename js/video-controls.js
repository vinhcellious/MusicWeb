document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('background-video');
    const volumeToggleButton = document.getElementById('volume-toggle-button');
    // const volumeSlider = document.getElementById('volume-slider'); // Không còn dùng thanh trượt

    if (video && volumeToggleButton) { // Chỉ kiểm tra video và nút toggle
        const VOLUME_STEP = 0.1; // Bước tăng/giảm âm lượng
        const MAX_VOLUME = 1.0;
        const MIN_VOLUME = 0.0;

        // Đảm bảo video bắt đầu không bị tắt tiếng nếu bạn muốn có âm thanh ngay
        // Nếu bạn muốn mặc định là mute, hãy giữ thuộc tính 'muted' trong HTML
        // và thêm video.muted = true; ở đây nếu muốn JS kiểm soát
        // video.muted = false; // Ví dụ: Bỏ muted ban đầu qua JS nếu không có trong HTML

        // Khởi tạo trạng thái biểu tượng loa ban đầu
        updateVolumeIcon();

        // Xử lý sự kiện click cho nút âm lượng
        volumeToggleButton.addEventListener('click', () => {
            if (video.muted) {
                // Nếu đang tắt tiếng, bật tiếng và đặt về mức âm lượng trước đó (hoặc mặc định)
                video.muted = false;
                video.volume = video.volume === 0 ? 0.5 : video.volume; // Nếu trước đó là 0, đặt 0.5
            } else {
                // Nếu đang có tiếng, điều chỉnh âm lượng
                video.volume += VOLUME_STEP; // Tăng âm lượng

                if (video.volume > MAX_VOLUME) {
                    video.volume = MIN_VOLUME; // Quay về 0 nếu vượt quá max
                    video.muted = true; // Tắt tiếng khi về 0
                }
            }
            updateVolumeIcon(); // Cập nhật biểu tượng
            console.log('Current volume:', video.volume.toFixed(1), 'Muted:', video.muted);
        });


        // Hàm cập nhật biểu tượng loa dựa trên trạng thái âm lượng
        function updateVolumeIcon() {
            const icon = volumeToggleButton.querySelector('i');
            if (!icon) return; // Đảm bảo biểu tượng tồn tại

            icon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');

            if (video.muted || video.volume === 0) {
                icon.classList.add('fa-volume-mute'); // Biểu tượng tắt tiếng
            } else if (video.volume < 0.5) {
                icon.classList.add('fa-volume-down'); // Biểu tượng âm lượng thấp
            } else {
                icon.classList.add('fa-volume-up'); // Biểu tượng âm lượng cao
            }
        }

        // Tùy chọn: Bạn có thể thêm logic để nếu muốn, giữ nguyên khả năng điều khiển bằng phím
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'ArrowUp') { // Mũi tên lên để tăng
        //         video.volume = Math.min(MAX_VOLUME, video.volume + VOLUME_STEP);
        //         video.muted = false;
        //         updateVolumeIcon();
        //     } else if (e.key === 'ArrowDown') { // Mũi tên xuống để giảm
        //         video.volume = Math.max(MIN_VOLUME, video.volume - VOLUME_STEP);
        //         if (video.volume === 0) {
        //             video.muted = true;
        //         }
        //         updateVolumeIcon();
        //     }
        // });

    } else {
        console.warn("Video or volume toggle button not found in DOM.");
    }
});