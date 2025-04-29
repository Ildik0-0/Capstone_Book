document.addEventListener("DOMContentLoaded", function () {
  const stars = document.querySelectorAll(".star");
  const ratingInput = document.getElementById("ratingInput");

  // Ensure stars update when clicked
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.dataset.value, 10); // Get clicked star’s value
      updateStars(rating); // Update star display
      ratingInput.value = rating; // Update hidden input
      console.log("Rating updated to:", rating); // Debugging log
    });
  });

  function updateStars(rating) {
    stars.forEach((star) => {
      if (parseInt(star.dataset.value, 10) <= rating) {
        star.innerHTML = "&#9733;"; // Filled star (★)
        star.classList.add("active");
      } else {
        star.innerHTML = "&#9734;"; // Empty star (☆)
        star.classList.remove("active");
      }
    });
  }
});