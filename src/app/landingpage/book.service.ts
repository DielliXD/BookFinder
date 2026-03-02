import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';

function toBookItem(doc: any): any {
  const workId = (doc.key || '').replace(/^\/works\//, '') || doc.key;
  const coverId = doc.cover_i;
  const thumbnail = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : undefined;
  return {
    id: workId,
    volumeInfo: {
      title: doc.title || 'Unknown',
      authors: doc.author_name || [],
      imageLinks: thumbnail ? { thumbnail } : undefined,
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined
    }
  };
}

function docMatchesSearch(doc: any, searchWords: string[]): boolean {
  if (!searchWords.length) return true;
  const toStr = (v: any) => (Array.isArray(v) ? v.join(' ') : (v || ''));
  const title = (doc.title || '').toLowerCase();
  const authors = toStr(doc.author_name).toLowerCase();
  const subjects = toStr(doc.subject || doc.subjects).toLowerCase();
  const place = toStr(doc.place).toLowerCase();
  const person = toStr(doc.person).toLowerCase();
  const searchable = [title, authors, subjects, place, person].join(' ');
  return searchWords.some((word) => searchable.includes(word));
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  constructor(private http: HttpClient) { }

  getBooks(offset = 0, limit = 25, subject = 'fiction'): Observable<{ items: any[]; hasMore: boolean; totalItems?: number }> {
    const params = new HttpParams()
      .set('subject', subject)
      .set('limit', String(limit))
      .set('offset', String(offset))
      .set('fields', 'key,title,author_name,cover_i,first_publish_year');
    return this.http.get<any>(OPEN_LIBRARY_SEARCH, { params }).pipe(
      map((res) => {
        const docs = res.docs || [];
        const totalItems = res.numFound != null ? res.numFound : undefined;
        return {
          items: docs.map(toBookItem),
          hasMore: docs.length === limit,
          totalItems: offset === 0 ? totalItems : undefined
        };
      })
    );
  }

  bookInfo(idBook: string): Observable<any> {
    const url = `https://openlibrary.org/works/${idBook}.json`;
    return this.http.get<any>(url).pipe(
      switchMap((work) => {
        const desc = work.description;
        const description = typeof desc === 'string' ? desc : (desc?.value || '');
        const coverId = work.covers?.[0];
        const thumbnail = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
          : undefined;
        const authorKeys = (work.authors || [])
          .map((a: any) => (a.author?.key || '').replace(/^\/authors\//, ''))
          .filter((k: string) => k.length > 0);
        const authorRequests =
          authorKeys.length === 0
            ? of([] as string[])
            : forkJoin(
                authorKeys.map((key: string) =>
                  this.http.get<any>(`https://openlibrary.org/authors/${key}.json`).pipe(
                    map((author) => author?.personal_name || author?.name || key),
                    map((name) => (typeof name === 'string' ? name : key)),
                    catchError(() => of(key))
                  )
                )
              ).pipe(
                map((names) => names as string[]),
                map((names) => names.filter(Boolean))
              );
        return authorRequests.pipe(
          map((authorNames) => {
            const authors = authorNames.length ? authorNames : (authorKeys.length ? authorKeys : ['Unknown']);
            return {
              id: idBook,
              volumeInfo: {
                title: work.title || 'Unknown',
                authors,
                description,
                imageLinks: thumbnail ? { thumbnail } : undefined,
                publishedDate: work.first_publish_date ? String(work.first_publish_date) : undefined,
                pageCount: work.number_of_pages_median,
                publisher: work.publisher ? String(work.publisher) : undefined,
                categories: work.subjects?.slice(0, 5) || [],
                industryIdentifiers: work.isbns ? [{ identifier: work.isbns[0] }] : []
              }
            };
          })
        );
      })
    );
  }

  searchBooks(query: string, offset = 0, limit = 100): Observable<{ items: any[]; totalItems: number; hasMore: boolean }> {
    const q = query.trim();
    const searchWords = q.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    const requestLimit = Math.max(limit, 100);
    const params = new HttpParams().set('q', q).set('limit', String(requestLimit)).set('offset', String(offset));
    return this.http.get<any>(OPEN_LIBRARY_SEARCH, { params }).pipe(
      map((res) => {
        const docs = res.docs || [];
        const filtered = searchWords.length
          ? docs.filter((doc: any) => docMatchesSearch(doc, searchWords))
          : docs;
        const items = filtered.slice(0, limit).map(toBookItem);
        return {
          items,
          totalItems: offset === 0 ? (res.numFound ?? 0) : 0,
          hasMore: docs.length >= requestLimit || filtered.length > limit
        };
      })
    );
  }
}
