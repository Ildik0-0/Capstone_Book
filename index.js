
// app.js
import axios from "axios";
import pg from "pg";
import express from "express";
import bodyParser from "body-parser";
import { db } from "./db/db.js"; // Adjust the path as necessary


const app = express();
const port = 3000;

// Set view engine to EJS
app.set("view engine", "ejs");

// Middleware for parsing and serving static assets
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



/*
  GET "/" Route:
  - Accepts optional query parameters:
    • q = search query (defaults to "all")
    • page = page number (defaults to 1)
  - Fetches data from Open Library's search API and limits the displayed results
    to 20 per page.
  - Renders the results and passes current pagination data to the template.
*/
app.get("/", async (req, res) => {
  // Get the search query and page from query parameters
  const query = req.query.q || "all";
  const page = parseInt(req.query.page, 10) || 1;

  // Build API URL with query and page parameters
  const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}&page=${page}`;

  try {
    const response = await axios.get(apiUrl);
    // Optionally, slice the results. Here we limit the display to 20 books per page.
    const results = response.data.docs.slice(0, 20);
    const books = results.map((book) => {
      // Prefer cover_i if available, otherwise use ISBN or a placeholder
      let coverUrl;
      if (book.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
      } else if (book.isbn && book.isbn.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
      } else {
        coverUrl = "/images/placeholder.jpg"; // Make sure this image exists in public/images
      }
      return {
        title: book.title,
        author: book.author_name ? book.author_name[0] : "Unknown",
        isbn:
          book.isbn && book.isbn.length > 0 ? book.isbn[0] : "N/A",
        cover: coverUrl,
        publisher: book.publisher ? book.publisher[0] : "Unknown",
      };
    });

    res.render("index.ejs", {
      books,         // The list of books to display
      total: books.length,
      currentPage: page, // Current page number
      query,           // Current search query
      numFound: response.data.numFound, // Total results returned by the API
      publisher: results.publisher, // Publisher information
      
    });
  } catch (error) {
    console.error("Error fetching books from API:", error);
    res
      .status(500)
      .send("Error fetching books from the API. Please try again.");
  }
});

//Route to fetch author details


app.get("/authors", async (req, res) => {
  // If a user specified a search term, use it. Otherwise, use a default query (e.g., "a").
  const query = req.query.q || "a";
  const apiUrl = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(apiUrl);
    // The API returns author objects under the "docs" property.
    const authors = response.data.docs;
    // Render the aboutauthor.ejs template, passing the authors array.
    res.render("aboutauthor.ejs", { authors, query });
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).send("Error fetching authors. Please try again.");
  }
});



  app.get("/author/:id", async (req, res) => {
    const authorId = req.params.id; // Example: "OL23919A"
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const worksPerPage = 20;
  
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(authorId)}&page=${page}`;
    const authorDetailsUrl = `https://openlibrary.org/authors/${authorId}.json`;
  
    try {
      // Fetch both author details and search results (works)
      const [searchResponse, authorResponse] = await Promise.all([
        axios.get(searchUrl),
        axios.get(authorDetailsUrl),
      ]);
  
      const authorData = authorResponse.data; // Author details
      const results = searchResponse.data.docs; // Results from search API
  
      // Extract relevant data from works
      const works = results.slice(0, worksPerPage).map((work) => {
        let coverUrl;
        if (work.cover_i) {
          coverUrl = `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg`;
        } else if (work.isbn && work.isbn.length > 0) {
          coverUrl = `https://covers.openlibrary.org/b/isbn/${work.isbn[0]}-L.jpg`;
        } else {
          coverUrl = "/images/placeholder.jpg"; // Fallback for missing covers
        }
        return {
          title: work.title,
          author: work.author_name ? work.author_name[0] : "Unknown",
          cover: coverUrl,
        };
      });
  
      // Compute author cover image
      const authorCoverUrl = authorData.key
  ? `https://covers.openlibrary.org/a/olid/${authorData.key.replace('/authors/', '')}-L.jpg`
  : '/images/placeholder.jpg';
  
      // Pagination details
      const totalWorks = searchResponse.data.numFound;
      const totalPages = Math.ceil(totalWorks / worksPerPage);
  
      // Render EJS template with works, author details, and pagination info
      console.log("Author Cover URL:", authorCoverUrl);
     
      res.render("authorid.ejs", {
        works,
        authorCover: authorCoverUrl,
        authorName: authorData.name,
        authorBio: typeof authorData.bio === "object" ? authorData.bio?.value : authorData.bio,
        currentPage: page,
        totalPages,
        totalWorks,
        authorId,
      });
    } catch (error) {
      console.error("Error fetching author details or works:", error);
      res.status(500).send("Error fetching author details. Please try again.");
    }
  });

 














// POST route to save a selected book to the database
app.post("/save", async (req, res) => {
  const { title, author, isbn, cover } = req.body;
  try {
    await db.query(
      "INSERT INTO books (title, author, isbn, cover_url) VALUES ($1, $2, $3, $4)",
      [title, author, isbn, cover]
    );
    res.redirect("/"); // After saving, redirect back to the homepage
  } catch (error) {
    console.error("Error saving book:", error);
    res.status(500).send("Error saving the book. Please try again.");
  }
});

//render the saved books to savebooks.ejs
// GET /savebook - render the save book form with extra inputs for rating and note
app.get("/savebook", (req, res) => {
    // Extract book details from query
    const { title, author, isbn, cover, publisher,query } = req.query;
    res.render("savebook.ejs", { title, author, isbn, cover, publisher, query });
  });


//---------------------------------------------------------------------------------------------------------------------
  // CRUD operations for the saved books
// POST /savebook - Save the complete book info (with rating and note) to the database
app.post("/savebook", async (req, res) => {
    const { title, author, isbn, cover, publisher, rating, notes } = req.body;
    try {
      await db.query(
        "INSERT INTO books (title, author, isbn, cover_url, publisher, rating, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [title, author, isbn, cover, publisher, rating, notes]
      );
      res.redirect("/"); // Redirect back to the homepage after saving
    } catch (error) {
      console.error("Error saving book with rating and notes:", error);
      res.status(500).send("Error saving the book. Please try again.");
    }
  });

//show all the saved books in the database
 // GET /showbook - Show all saved books that have been saved and rated
    app.get('/showbook', async (req, res) => {
    try {
      // Query your books table – adjust the query as needed.
      const result = await db.query("SELECT * FROM books ORDER BY id DESC");
      const books = result.rows;
      
      // Render the showbook.ejs file, passing the books data
      res.render("showbook.ejs", { books, query: req.query.q });
    } catch (error) {
      console.error("Error retrieving saved books:", error);
      res.status(500).send("Error retrieving saved books. Please try again.");
    }
  });

//edit the saved book
// GET /editbook/:id - Render the edit form for a specific book
app.get('/editbook/:id', async (req, res) => {
    const bookId = req.params.id; // Get the ID from the URL
    try {
      const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
      const book = result.rows[0];
      res.render("editbook.ejs", { book });
    } catch (error) {
      console.error("Error fetching book for edit:", error);
      res.status(500).send("Error fetching book. Please try again.");
    }
  });
  
  // POST /editbook/:id - Update a specific book in the database
  app.post('/editbook/:id', async (req, res) => {
    const bookId = req.params.id;
    const { title, author, isbn, publisher, rating, notes } = req.body;
    try {
      await db.query(
        "UPDATE books SET title = $1, author = $2, isbn = $3, publisher = $4, rating = $5, notes = $6 WHERE id = $7",
        [title, author, isbn, publisher, rating, notes, bookId]
      );
      res.redirect("/showbook"); // Redirect back to the books list
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).send("Error updating book. Please try again.");
    }
  });
  
  // POST /deletebook/:id - Delete a specific book from the database
  app.post('/deletebook/:id', async (req, res) => {
    const bookId = req.params.id; // Extract the book ID from the URL
  
    try {
      // Perform a DELETE operation in the database
      await db.query("DELETE FROM books WHERE id = $1", [bookId]);
      res.redirect("/showbook"); // Redirect back to the books list after deletion
    } catch (error) {
      console.error("Error deleting book:", error); // Log any errors
      res.status(500).send("Error deleting book. Please try again."); // Send error response
    }
  });



















// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});