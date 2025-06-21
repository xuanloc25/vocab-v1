document.addEventListener('DOMContentLoaded', function() {
    // --- KHAI BÁO BIẾN TOÀN CỤC VÀ LẤY ELEMENT ---
    let fullWordList = [];
    let dueReviewWords = [];
    let currentWordIndex = -1;

    const reviewInterface = document.getElementById('review-interface');
    const noReviewMessage = document.getElementById('no-review-message');
    const reviewCountSpan = document.getElementById('review-count');
    
    const reviewCard = document.querySelector('.review-card');
    const showAnswerBtn = document.getElementById('show-answer-btn');

    // Mặt trước thẻ
    const wordFront = document.getElementById('review-word');
    
    // Mặt sau thẻ
    const wordBack = document.querySelector('.review-back');
    const ipaBack = document.getElementById('review-ipa');
    const audioBtnBack = document.getElementById('review-play-audio-btn');
    const defEnBack = document.getElementById('review-def-en');
    const defViBack = document.getElementById('review-def-vi');
    const exampleBack = document.getElementById('review-example');
    const srsButtons = document.querySelectorAll('.srs-btn');

    // --- LOGIC CHÍNH ---

    // 1. Hàm khởi tạo, tải dữ liệu từ localStorage
    function initializeReview() {
        fullWordList = JSON.parse(localStorage.getItem('vocabReviewList')) || [];
        
        if (fullWordList.length === 0) {
            showCompletionMessage();
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        dueReviewWords = fullWordList.filter(word => word.reviewDate <= today);
        
        reviewCountSpan.textContent = dueReviewWords.length;

        if (dueReviewWords.length > 0) {
            currentWordIndex = 0;
            displayCurrentWord();
            reviewInterface.classList.remove('hidden');
            noReviewMessage.classList.add('hidden');
        } else {
            showCompletionMessage();
        }
    }

    // 2. Hiển thị từ hiện tại lên giao diện
    function displayCurrentWord() {
        if (currentWordIndex >= dueReviewWords.length) {
            showCompletionMessage();
            return;
        }
        
        const wordData = dueReviewWords[currentWordIndex];
        
        // Reset thẻ về mặt trước
        reviewCard.classList.remove('is-flipped');
        wordBack.classList.add('hidden');

        // Điền thông tin
        wordFront.textContent = wordData.word;
        ipaBack.textContent = wordData.ipa;
        defEnBack.textContent = wordData.definition_en;
        defViBack.textContent = wordData.definition_vi;
        exampleBack.innerHTML = wordData.example_general.replace(new RegExp(`\\b(${wordData.word})\\b`, 'gi'), '<strong>$1</strong>');
    }

    // 3. Hiển thị thông báo khi hoàn thành
    function showCompletionMessage() {
        reviewInterface.classList.add('hidden');
        noReviewMessage.classList.remove('hidden');
        reviewCountSpan.textContent = 0;
    }
    
    // 4. Xử lý logic Spaced Repetition (SRS)
    function handleSrsEvaluation(event) {
        const levelChange = parseInt(event.target.dataset.levelChange);
        let currentWord = dueReviewWords[currentWordIndex];

        // Cập nhật srsLevel (giữ tối thiểu là 1)
        let newSrsLevel = (currentWord.srsLevel || 1) + levelChange;
        if (newSrsLevel < 1) newSrsLevel = 1;
        
        // Thuật toán SRS đơn giản: Tính ngày ôn tập tiếp theo
        // Level 1: 1 ngày, Level 2: 3 ngày, Level 3: 7 ngày, Level 4: 14 ngày ...
        const intervals = [1, 3, 7, 14, 30, 90, 180]; // Các khoảng ngày ôn tập
        const nextIntervalDays = intervals[newSrsLevel - 1] || intervals[intervals.length - 1];

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);
        
        // Cập nhật từ này trong danh sách tổng
        const wordIndexInFullList = fullWordList.findIndex(word => word.word === currentWord.word);
        if (wordIndexInFullList > -1) {
            fullWordList[wordIndexInFullList].srsLevel = newSrsLevel;
            fullWordList[wordIndexInFullList].reviewDate = nextReviewDate.toISOString().split('T')[0];
        }

        // Lưu lại danh sách tổng vào localStorage
        localStorage.setItem('vocabReviewList', JSON.stringify(fullWordList));
        
        console.log(`Đã ôn tập từ "${currentWord.word}". Level mới: ${newSrsLevel}. Hẹn gặp lại sau ${nextIntervalDays} ngày.`);

        // Chuyển sang từ tiếp theo
        currentWordIndex++;
        displayCurrentWord();
    }

    // --- GẮN CÁC SỰ KIỆN ---
    
    // Sự kiện lật thẻ
    showAnswerBtn.addEventListener('click', () => {
        reviewCard.classList.add('is-flipped');
        // Dùng timeout nhỏ để đảm bảo hiệu ứng CSS chạy trước khi display:flex được áp dụng
        setTimeout(() => {
            wordBack.classList.remove('hidden');
        }, 100);
    });
    
    // Sự kiện cho các nút đánh giá (Khó, Dễ, Tạm ổn)
    srsButtons.forEach(button => {
        button.addEventListener('click', handleSrsEvaluation);
    });

    // Sự kiện phát âm
    audioBtnBack.addEventListener('click', () => {
        const word = wordFront.textContent;
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    });

    // --- KHỞI CHẠY ---
    initializeReview();
});