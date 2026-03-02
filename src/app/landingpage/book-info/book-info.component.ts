import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookService } from 'src/app/landingpage/book.service';


@Component({
  selector: 'app-book-info',
  templateUrl: './book-info.component.html',
  styleUrls: ['./book-info.component.css']
})
export class BookInfoComponent implements OnInit {
  idBook: string = '';
  book: any;

  constructor(private serviceBook: BookService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
        const id = params['id'];
        this.idBook = id; 
        this.bookInfo(); 
    });
  }

  bookInfo() {
    this.serviceBook.bookInfo(this.idBook)
    .subscribe((data: any) => {
      this.book = data;
    }); 
  }
  openBookDetails(bookId: string) {
    window.open(`https://openlibrary.org/works/${bookId}`, '_blank');
  }

  hasAnyMeta(book: any): boolean {
    if (!book?.volumeInfo) return false;
    const v = book.volumeInfo;
    return !!(v.publishedDate || v.pageCount != null || v.publisher || (v.categories?.length) || v.industryIdentifiers?.[0]?.identifier);
  }
}
