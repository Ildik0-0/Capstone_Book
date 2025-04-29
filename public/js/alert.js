function confirmDelete(event) {
    const confirmed = confirm("Are you sure you want to delete this book?");
    if (!confirmed) {
      event.preventDefault(); // Stop the form submission
    }
    return confirmed; // Return true if confirmed, false otherwise
  }