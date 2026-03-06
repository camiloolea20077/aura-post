import { HttpResponse, HttpInterceptorFn } from '@angular/common/http';
import { map } from 'rxjs';
import { formatDate } from '../../shared/utils/date.utils';

const convertDates = (body: any): any => {
  if (body === null || body === undefined) return body;

  if (typeof body === 'string' && isIsoDate(body)) {
    return formatDate(body, 'yyyy-MM-dd HH:mm:ss');
  }

  if (Array.isArray(body)) {
    return body.map((v) => convertDates(v));
  }

  if (typeof body === 'object') {
    Object.keys(body).forEach((key) => {
      body[key] = convertDates(body[key]);
    });
  }

  return body;
};

const isIsoDate = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
};

export const DateInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({
          body: convertDates(event.body),
        });
      }
      return event;
    }),
  );
};
