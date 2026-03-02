import { Component, OnInit } from '@angular/core';
import { BookService } from '../book.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css']
})
export class LandingpageComponent implements OnInit {
  books: any[] = [];
  loading: boolean = false;
  loadingMore: boolean = false;
  error: string = '';
  hasMore = false;
  private browseOffset = 0;
  private searchOffset = 0;
  private lastQuery = '';
  private prefetchedNext: { items: any[]; hasMore: boolean } | null = null;
  skeletonCount = Array.from({ length: 25 }, (_, i) => i);
  skeletonMoreCount = Array.from({ length: 6 }, (_, i) => i);
  searchQuery = '';
  mobileSearchQuery = '';
  mobileSearchFocused = false;
  noSearchResults = false;
  suggestedSearches = ['Harry Potter', '1984', 'Pride and Prejudice', 'The Great Gatsby', 'To Kill a Mockingbird'];
  currentPage = 1;
  totalSearchResults = 0;
  totalBrowseResults = 0;
  readonly browsePageSize = 25;
  readonly searchPageSize = 100;
  selectedCategory = 'fiction';
  mobileMenuOpen = false;
  categories = [
    { id: 'fiction', label: 'Fiction' },
    { id: 'science_fiction', label: 'Science Fiction' },
    { id: 'mystery', label: 'Mystery' },
    { id: 'romance', label: 'Romance' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'biography', label: 'Biography' },
    { id: 'history', label: 'History' },
    { id: 'science', label: 'Science' },
    { id: 'thriller', label: 'Thriller' },
    { id: 'horror', label: 'Horror' }
  ];

  constructor(private bookService: BookService, private router: Router) { }

  clearSearch(input: HTMLInputElement, isMobile: boolean): void {
    this.searchQuery = '';
    this.mobileSearchQuery = '';
    if (isMobile) {
      setTimeout(() => {
        input.focus();
      }, 0);
    } else {
      input.focus();
    }
  }

  dismissMobileSearch(input: HTMLInputElement): void {
    input.blur();
  }

  goToLandingDefault(): void {
    this.searchQuery = '';
    this.mobileSearchQuery = '';
    this.loadRandomBooks();
    window.scrollTo(0, 0);
  }

  setCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.mobileMenuOpen = false;
    this.loadBooksByCategory();
    this.scrollToResults();
  }

  loadBooksByCategory(): void {
    this.loading = true;
    this.error = '';
    this.noSearchResults = false;
    this.lastQuery = '';
    this.browseOffset = 0;
    this.searchOffset = 0;
    this.prefetchedNext = null;
    this.currentPage = 1;
    this.bookService.getBooks(0, this.browsePageSize, this.selectedCategory).subscribe({
      next: (res) => {
        const items = res?.items ?? [];
        this.totalBrowseResults = res?.totalItems ?? items.length;
        if (items.length === 0) {
          this.books = [];
          this.error = 'No books in this category right now. Try another.';
        } else {
          this.books = items;
          this.hasMore = res?.hasMore ?? false;
          this.browseOffset = items.length;
          this.prefetchNext();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Something went wrong. Check your connection and try again.';
        this.books = [];
        this.loading = false;
      }
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  ngOnInit(): void {
    this.loadRandomBooks();
  }

  loadRandomBooks(): void {
    this.loading = true;
    this.error = '';
    this.noSearchResults = false;
    this.lastQuery = '';
    this.browseOffset = 0;
    this.searchOffset = 0;
    this.prefetchedNext = null;
    this.bookService.getBooks(0, this.browsePageSize, this.selectedCategory).subscribe({
      next: (res) => {
        const items = res?.items ?? [];
        this.totalBrowseResults = res?.totalItems ?? items.length;
        this.currentPage = 1;
        if (items.length === 0) {
          this.books = [];
          this.error = 'We couldn\'t find any books right now. Try again in a moment.';
        } else {
          this.books = items;
          this.hasMore = res?.hasMore ?? false;
          this.browseOffset = items.length;
          this.prefetchNext();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Something went wrong. Check your connection and try again.';
        this.books = [];
        this.loading = false;
      }
    });
  }

  onSearch(query: string): void {
    const trimmed = query?.trim() ?? '';
    if (!trimmed) {
      this.error = '';
      this.loadRandomBooks();
      return;
    }
    this.searchQuery = trimmed;
    this.mobileSearchQuery = trimmed;
    this.loading = true;
    this.error = '';
    this.lastQuery = trimmed;
    this.searchOffset = 0;
    this.prefetchedNext = null;
    this.bookService.searchBooks(trimmed, 0, this.searchPageSize).subscribe({
      next: (res) => {
        const items = res?.items ?? [];
        this.books = items;
        this.totalSearchResults = res?.totalItems ?? 0;
        this.currentPage = 1;
        this.hasMore = res?.hasMore ?? false;
        this.searchOffset = this.searchPageSize;
        if (items.length === 0) {
          this.noSearchResults = true;
          this.error = "No books found for \"" + trimmed + "\". Try another title or author.";
        } else {
          this.noSearchResults = false;
          this.error = '';
          this.prefetchNext();
        }
        this.loading = false;
        this.scrollToResults();
      },
      error: () => {
        this.noSearchResults = false;
        this.error = 'Search didn\'t work. Check your connection and try again.';
        this.books = [];
        this.loading = false;
        this.scrollToResults();
      }
    });
  }

  private scrollToResults(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private readonly maxPages = 100;

  get totalPages(): number {
    if (this.lastQuery) {
      const total = Math.max(0, this.totalSearchResults);
      const pages = total === 0 ? 1 : Math.ceil(total / this.searchPageSize);
      return Math.min(pages, this.maxPages);
    }
    const total = Math.max(0, this.totalBrowseResults);
    const pages = total === 0 ? 1 : Math.ceil(total / this.browsePageSize);
    return Math.min(pages, this.maxPages);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const maxVisible = 7;
    const current = this.currentPage;
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loading = true;
    this.prefetchedNext = null;
    if (this.lastQuery === '') {
      const offset = (page - 1) * this.browsePageSize;
      this.browseOffset = offset + this.browsePageSize;
      this.bookService.getBooks(offset, this.browsePageSize, this.selectedCategory).subscribe({
        next: (res) => {
          this.books = res?.items ?? [];
          this.hasMore = res?.hasMore ?? false;
          this.loading = false;
          this.prefetchNext();
          this.scrollToResults();
        },
        error: () => { this.loading = false; }
      });
    } else {
      const offset = (page - 1) * this.searchPageSize;
      this.searchOffset = offset + this.searchPageSize;
      this.bookService.searchBooks(this.lastQuery, offset, this.searchPageSize).subscribe({
        next: (res) => {
          this.books = res?.items ?? [];
          this.hasMore = res?.hasMore ?? false;
          this.loading = false;
          this.prefetchNext();
          this.scrollToResults();
        },
        error: () => { this.loading = false; }
      });
    }
  }

  searchSuggested(term: string): void {
    this.onSearch(term);
  }

  loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;
    if (this.prefetchedNext) {
      const { items, hasMore } = this.prefetchedNext;
      this.prefetchedNext = null;
      this.books = this.books.concat(items);
      this.hasMore = hasMore;
      if (this.lastQuery === '') {
        this.browseOffset += items.length;
      } else {
        this.searchOffset += this.searchPageSize;
      }
      this.prefetchNext();
      return;
    }
    this.loadingMore = true;
    if (this.lastQuery === '') {
      this.bookService.getBooks(this.browseOffset, this.browsePageSize, this.selectedCategory).subscribe({
        next: (res) => {
          const items = res?.items ?? [];
          this.books = this.books.concat(items);
          this.hasMore = res?.hasMore ?? false;
          this.browseOffset += items.length;
          this.loadingMore = false;
          this.prefetchNext();
        },
        error: () => { this.loadingMore = false; }
      });
    } else {
      this.bookService.searchBooks(this.lastQuery, this.searchOffset, this.searchPageSize).subscribe({
        next: (res) => {
          const items = res?.items ?? [];
          this.books = this.books.concat(items);
          this.hasMore = res?.hasMore ?? false;
          this.searchOffset += this.searchPageSize;
          this.loadingMore = false;
          this.prefetchNext();
        },
        error: () => { this.loadingMore = false; }
      });
    }
  }

  private prefetchNext(): void {
    if (!this.hasMore) return;
    if (this.lastQuery === '') {
      this.bookService.getBooks(this.browseOffset, this.browsePageSize, this.selectedCategory).subscribe({
        next: (res) => { this.prefetchedNext = { items: res?.items ?? [], hasMore: res?.hasMore ?? false }; },
        error: () => { this.prefetchedNext = null; }
      });
    } else {
      this.bookService.searchBooks(this.lastQuery, this.searchOffset, this.searchPageSize).subscribe({
        next: (res) => { this.prefetchedNext = { items: res?.items ?? [], hasMore: res?.hasMore ?? false }; },
        error: () => { this.prefetchedNext = null; }
      });
    }
  }

  showBook(idBook: string): void {
    this.router.navigate(['/book-info', idBook]);
  }
}
