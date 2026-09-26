/* =========================================================
   dice.js
   Chuyển từ components/DiceRandomizer.tsx (3 hộp bí ẩn).
   Dùng 3 phần tử HTML có class "mystery-box" thay vì JSX.

   Cách dùng trong HTML:
     <div class="row g-3 mb-4" id="mysteryBoxes">
       <div class="col-4"><div class="mystery-box" data-idx="0">...</div></div>
       <div class="col-4"><div class="mystery-box" data-idx="1">...</div></div>
       <div class="col-4"><div class="mystery-box" data-idx="2">...</div></div>
     </div>
     <script>
       const dice = createDiceRandomizer(document.getElementById('mysteryBoxes'), candidateFoods, function(winner){ ... });
       // gọi dice.roll() khi bấm nút "Lắc xúc xắc"
     </script>
   ========================================================= */

function createDiceRandomizer(container, candidates, onFinish) {
  const boxes = Array.from(container.querySelectorAll('.mystery-box'));
  let isShuffling = false;

  function renderBoxDefault(box, idx) {
    box.classList.remove('active', 'winner');
    box.innerHTML =
      '<div class="d-flex flex-column align-items-center gap-2">' +
      '<div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" ' +
      'style="width:52px;height:52px;background:#FFEDD5;color:#EA580C;font-size:1.5rem;">?</div>' +
      '<span class="small fw-semibold">Hộp bí ẩn #' + (idx + 1) + '</span>' +
      '</div>';
  }

  function renderBoxWinner(box, food) {
    box.classList.add('winner');
    box.innerHTML =
      '<div class="d-flex flex-column align-items-center gap-2">' +
      '<img src="' + food.image + '" alt="' + food.name + '">' +
      '<span class="fw-bold small">' + food.name + '</span>' +
      '<span class="badge bg-white text-dark bg-opacity-25 small">Chân ái 🎉</span>' +
      '</div>';
  }

  boxes.forEach((box, idx) => renderBoxDefault(box, idx));

  function roll() {
    if (isShuffling || !candidates || candidates.length === 0) return;
    isShuffling = true;

    const targetCard = Math.floor(Math.random() * 3);
    const chosenFood = candidates[Math.floor(Math.random() * candidates.length)];

    let count = 0;
    boxes.forEach((box, idx) => renderBoxDefault(box, idx));

    const interval = setInterval(() => {
      boxes.forEach((box) => box.classList.remove('active'));
      const activeIdx = count % 3;
      boxes[activeIdx].classList.add('active');
      count++;
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      boxes.forEach((box) => box.classList.remove('active'));
      renderBoxWinner(boxes[targetCard], chosenFood);
      isShuffling = false;
      if (typeof onFinish === 'function') onFinish(chosenFood);
    }, 2400);
  }

  boxes.forEach((box) => box.addEventListener('click', roll));

  function updateCandidates(list) {
    candidates = list;
    if (!isShuffling) boxes.forEach((box, idx) => renderBoxDefault(box, idx));
  }

  return { roll, isShuffling: () => isShuffling, updateCandidates };
}
