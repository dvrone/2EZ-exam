document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form").forEach((form) => {
    // Brauzer built-in validatsiyasini o'chirish
    form.setAttribute("novalidate", true);

    form.addEventListener("submit", (e) => {
      let isValid = true;

      // Oldingi xatolarni tozalash
      form.querySelectorAll(".invalid-feedback").forEach((el) => el.remove());
      form.querySelectorAll(".is-invalid").forEach((el) => {
        el.classList.remove("is-invalid");
      });

      form.querySelectorAll("input, textarea, select").forEach((field) => {
        let message = "";

        if (field.validity.valueMissing) {
          message = "Bu maydonni to'ldiring!";
        } else if (field.validity.typeMismatch && field.type === "email") {
          message = "To'g'ri email manzil kiriting!";
        } else if (field.validity.tooShort) {
          message = `Kamida ${field.minLength} ta belgi kiriting!`;
        } else if (field.validity.patternMismatch) {
          message = "Noto'g'ri format!";
        }

        if (message) {
          isValid = false;
          field.classList.add("is-invalid");

          const feedback = document.createElement("div");
          feedback.className = "invalid-feedback d-block";
          feedback.textContent = message;
          field.parentNode.appendChild(feedback);
        }
      });

      if (!isValid) {
        e.preventDefault();
      }
    });

    // Maydon to'ldirilganda xatoni tozalash
    form.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", () => {
        field.classList.remove("is-invalid");
        const feedback = field.parentNode.querySelector(".invalid-feedback");
        if (feedback) feedback.remove();
      });
    });
  });
});