document.getElementById("searchButton").addEventListener("click", () => {
    const query = document.getElementById("searchInput").value.trim();
    if (query !== "") {
      searchAuthors(query);
    }
  });
  
  function searchAuthors(query) {
    // URL encode the query
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://openlibrary.org/search/authors.json?q=${encodedQuery}`;
    
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        renderAuthorCards(data.docs);
      })
      .catch(error => {
        console.error("Error fetching authors:", error);
      });
  }
  
  function renderAuthorCards(authors) {
    const container = document.getElementById("cardsContainer");
    container.innerHTML = ""; // Clear previous cards
    
    if (!authors || authors.length === 0) {
      container.innerHTML = "<p>No authors found.</p>";
      return;
    }
    
    authors.forEach(author => {
      // Each author object typically has these properties:
      // key, name, birth_date, top_work, work_count, etc.
      const card = document.createElement("div");
      card.classList.add("card");
      
      // Build the card content - adjust fields as needed
      card.innerHTML = `
        <h3>${author.name}</h3>
        ${author.birth_date ? `<p><strong>Birth Date:</strong> ${author.birth_date}</p>` : ""}
        ${author.top_work ? `<p><strong>Top Work:</strong> ${author.top_work}</p>` : ""}
        ${author.work_count ? `<p><strong>Works:</strong> ${author.work_count}</p>` : ""}
        <p><strong>Key:</strong> ${author.key}</p>
      `;
      
      // Optionally, add a button to view more details:
      // You can later attach an event that fetches detailed info using:
      // https://openlibrary.org/authors/OL23919A.json (replace key appropriately)
      const detailButton = document.createElement("button");
      detailButton.innerText = "More Details";
      detailButton.addEventListener("click", () => {
        // Open a new page, modal, or fetch additional details
        window.open(`https://openlibrary.org${author.key}`, '_blank');
      });
      card.appendChild(detailButton);
      
      container.appendChild(card);
    });
  }