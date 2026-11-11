# BookFinder

A book discovery app built with Angular. Browse books by genre, search by title, author or topic, and open a detail page for any book. Data comes from the public [Open Library API](https://openlibrary.org/developers/api).

## Features

- **Browse by genre:** fiction, science fiction, mystery, romance, fantasy, biography, history, science, thriller and horror
- **Search:** by title, author or topic, with client-side relevance filtering across titles, authors and subjects
- **Suggested searches** when a search returns nothing
- **Book details:** cover, authors, description, first publish date, page count, subjects and a link to Open Library
- **Pagination and "load more":** the next page is prefetched in the background so it appears instantly
- **Loading skeletons** and friendly error messages for empty results or network problems
- **Responsive layout** with a separate mobile search bar and menu

## Technical highlights

- All API access lives in one `BookService`; Open Library responses are mapped into a single book shape used across the UI
- RxJS `switchMap` and `forkJoin` load a book's details and all of its author names in parallel, with per-author fallbacks via `catchError`
- Covers are loaded from the Open Library Covers API, with a placeholder image when a book has none

## Tech stack

- Angular 13, TypeScript, RxJS
- Angular Router, `HttpClient`, template-driven forms
- Open Library Search, Works, Authors and Covers APIs

## Project structure

    src/app/
      landingpage/
        book.service.ts     API calls and data mapping
        landingpage/        browse, search, genres, pagination
        book-info/          book detail page

## Run locally

    npm install
    npm start

Then open http://localhost:4200.
