import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public loading$ = this.loadingSubject.asObservable();

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  get<T>(endpoint: string): Observable<T> {
    this.loadingSubject.next(true);
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    this.loadingSubject.next(true);
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    this.loadingSubject.next(true);
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    this.loadingSubject.next(true);
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
