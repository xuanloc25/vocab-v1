document.addEventListener("DOMContentLoaded", function () {
  // --- PHẦN CẤU HÌNH ---
  const GEMINI_API_KEY = API_KEYS.GEMINI;
  const PIXABAY_API_KEY = API_KEYS.PIXABAY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;

  // --- BIẾN TOÀN CỤC ĐỂ LƯU DỮ LIỆU TỪ HIỆN TẠI ---
  let currentWordData = null;

  // --- LẤY CÁC ELEMENT TỪ HTML ---
  const topicGrid = document.querySelector(".topic-grid");
  const learningInterface = document.getElementById("learning-interface");
  const startButton = document.querySelector(
    ".topic-card:not(.disabled) .topic-button"
  );
  const nextWordButton = document.querySelector(".action-btn.skip");
  const playAudioBtn = document.getElementById("play-audio-btn");
  const learnButton = document.querySelector(".action-btn.learn");

  // --- HÀM GỌI GEMINI API (PHIÊN BẢN NÂNG CẤP CHỐNG LẶP TỪ) ---
  async function getNewWordFromAI() {
    setLoadingState(true);

    // --- BƯỚC CẢI TIẾN: LẤY DANH SÁCH TỪ ĐÃ HỌC ---
    const reviewList =
      JSON.parse(localStorage.getItem("vocabReviewList")) || [];
    const learnedWords = reviewList.map((item) => item.word); // Chỉ lấy tên các từ

    // Tạo một chuỗi danh sách các từ đã học để đưa vào prompt
    const exclusionListString =
      learnedWords.length > 0
        ? `The word MUST NOT be in the following list: [${learnedWords.join(
            ", "
          )}]`
        : "";

    // --- CẬP NHẬT PROMPT ---
    const prompt = `Act as an English lexicographer for a Vietnamese student. 
        Provide detailed information for ONE common English word suitable for a B1-B2 level learner.
        The information must be structured in a JSON format. Do not include the markdown characters \`\`\`json.
        
        ${exclusionListString} // Dặn AI không lấy từ trong danh sách này

        The JSON object must include:
        1. word: The word itself.
        2. level: The CEFR level (e.g., B1, B2).
        3. type: The part of speech (e.g., "adjective", "noun").
        4. ipa: The IPA phonetic transcription.
        5. definition_en: A concise English definition.
        6. definition_vi: A concise Vietnamese translation.
        7. example_general: A simple, general example sentence.
        8. example_domain: An example sentence related to computer engineering or technology.
        
        Return ONLY the raw JSON object.`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      currentWordData = JSON.parse(jsonString);
      updateWordCard(currentWordData);

      // --- GỌI HÀM LẤY ẢNH ---
      const imageUrl = await getImageForWord(currentWordData.word);
      currentWordData.imageUrl = imageUrl; // Gắn URL ảnh vào đối tượng từ vựng
      updateWordCard(currentWordData);
    } catch (error) {
      console.error("Error fetching from Gemini API:", error);
      alert(
        "Đã có lỗi xảy ra khi lấy từ mới. Vui lòng thử lại. Chi tiết lỗi ở trong Console."
      );
      showTopicSelection();
    } finally {
      setLoadingState(false);
    }
  }

  // --- HÀM MỚI: LẤY HÌNH ẢNH TỪ PIXABAY ---
  async function getImageForWord(word) {
    const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      word
    )}&image_type=photo&orientation=horizontal&per_page=3`;

    try {
      const response = await fetch(pixabayUrl);
      if (!response.ok) return null; // Nếu có lỗi, bỏ qua việc lấy ảnh

      const data = await response.json();
      if (data.hits && data.hits.length > 0) {
        return data.hits[0].webformatURL; // Lấy ảnh đầu tiên trong kết quả
      }
      return null; // Không tìm thấy ảnh phù hợp
    } catch (error) {
      console.error("Error fetching from Pixabay:", error);
      return null;
    }
  }

  // --- LOGIC MỚI: LƯU TỪ VÀO KHO ÔN TẬP ---
  function saveWordForReview() {
    if (!currentWordData) return;

    let reviewList = JSON.parse(localStorage.getItem("vocabReviewList")) || [];

    // Thêm ngày ôn tập cho từ hiện tại (ví dụ: ngày mai)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    currentWordData.reviewDate = tomorrow.toISOString().split("T")[0];
    currentWordData.srsLevel = 1;

    reviewList.push(currentWordData);
    localStorage.setItem("vocabReviewList", JSON.stringify(reviewList));

    console.log(`Đã lưu từ "${currentWordData.word}" vào danh sách ôn tập.`);
    console.log("Danh sách hiện tại:", reviewList);

    // Tự động chuyển sang từ tiếp theo
    getNewWordFromAI();
  }

  // --- HÀM CẬP NHẬT GIAO DIỆN (PHIÊN BẢN CÓ HÌNH ẢNH) ---
  function updateWordCard(data, imageUrl) {
    // Cập nhật thông tin chữ nghĩa như cũ
    document.getElementById("word").textContent = data.word;
    document.getElementById("ipa").textContent = data.ipa;
    // ... các dòng document.getElementById khác giữ nguyên ...
    document.getElementById("word-type").textContent = data.type;
    document.getElementById("word-level").textContent = data.level;
    document.getElementById("def-en").textContent = data.definition_en;
    document.getElementById("def-vi").textContent = data.definition_vi;
    document.getElementById("example-general").innerHTML =
      data.example_general.replace(
        new RegExp(`\\b(${data.word})\\b`, "gi"),
        "<strong>$1</strong>"
      );
    document.getElementById("example-domain").innerHTML =
      data.example_domain.replace(
        new RegExp(`\\b(${data.word})\\b`, "gi"),
        "<strong>$1</strong>"
      );

    // Cập nhật hình ảnh
    const imageContainer = document.getElementById("word-image-container");
    const imageEl = document.getElementById("word-image");

    if (imageUrl) {
      imageEl.src = imageUrl;
      imageContainer.classList.remove("hidden");
    } else {
      // Nếu không có ảnh thì ẩn khu vực ảnh đi
      imageContainer.classList.add("hidden");
    }
  }

  // --- HÀM QUẢN LÝ TRẠNG THÁI UI ---
  function showLearningInterface() {
    topicGrid.classList.add("hidden");
    learningInterface.classList.remove("hidden");
    getNewWordFromAI();
  }

  function showTopicSelection() {
    topicGrid.classList.remove("hidden");
    learningInterface.classList.add("hidden");
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      nextWordButton.disabled = true;
      nextWordButton.textContent = "Đang tải...";
      learnButton.disabled = true;
    } else {
      nextWordButton.disabled = false;
      nextWordButton.textContent = "Từ tiếp theo";
      learnButton.disabled = false;
    }
  }

  // --- GẮN CÁC SỰ KIỆN ---
  startButton.addEventListener("click", showLearningInterface);
  nextWordButton.addEventListener("click", getNewWordFromAI);
  learnButton.addEventListener("click", saveWordForReview);

  playAudioBtn.addEventListener("click", () => {
    const word = document.getElementById("word").textContent;
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Trình duyệt của bạn không hỗ trợ phát âm.");
    }
  });
});
