document.addEventListener('DOMContentLoaded', function() {
    // Hàm này giờ sẽ chạy trên tất cả các trang
    function updateSidebarReviewCount() {
        const reviewList = JSON.parse(localStorage.getItem('vocabReviewList')) || [];
        const reviewCountBadge = document.getElementById('sidebar-review-count');

        // Nếu không tìm thấy element huy hiệu thì không làm gì cả
        if (!reviewCountBadge) return;

        const today = new Date().toISOString().split('T')[0];
        const dueWordsCount = reviewList.filter(word => word.reviewDate <= today).length;

        if (dueWordsCount > 0) {
            reviewCountBadge.textContent = dueWordsCount;
            reviewCountBadge.classList.add('visible');
        } else {
            reviewCountBadge.classList.remove('visible');
        }
    }

    // Cập nhật số lượng ngay khi trang được tải
    updateSidebarReviewCount();
});
