/* Reusable retrieval-practice quiz widget.
   Usage: one <div class="quiz"> per question:

   <div class="quiz" data-answer="1">
     <p class="q">Question text?</p>
     <button>Option A</button>
     <button>Option B</button>
     <button>Option C</button>
     <div class="explain">Why the right answer is right.</div>
   </div>

   data-answer is the 0-based index of the correct button.
   Keep every option the same word/character count (no formatting tells). */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.quiz').forEach(quiz => {
    const correct = parseInt(quiz.dataset.answer, 10);
    const buttons = [...quiz.querySelectorAll('button')];
    const explain = quiz.querySelector('.explain');
    let answered = false;

    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        buttons.forEach((b, j) => {
          b.disabled = true;
          if (j === correct) b.classList.add('right');
          if (j === i && i !== correct) b.classList.add('wrong');
        });
        if (explain) explain.classList.add('show');
      });
    });
  });
});
