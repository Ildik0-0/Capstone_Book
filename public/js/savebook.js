document.addEventListener("DOMContentLoaded", function(){
  // Grab all star elements
  const stars = document.querySelectorAll('.star');
  console.log("Stars found:", stars.length);
  
  let ratingValue = 0;
  
  // Add click events to all stars
  stars.forEach(star => {
    star.addEventListener('click', () => {
      ratingValue = parseInt(star.dataset.value);
      updateRating(ratingValue);
    });
  });
  
  function updateRating(rating) {
    stars.forEach(star => {
      if (parseInt(star.dataset.value) <= rating) {
        star.textContent = '\u2605'; // Filled star (★)
        star.classList.add('active');
      } else {
        star.textContent = '\u2606'; // Empty star (☆)
        star.classList.remove('active');
      }
    });
    // Update the hidden input with the selected rating
    document.getElementById('ratingInput').value = rating;
    console.log('Rating set to:', rating);
  }
});