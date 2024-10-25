FROM node:18-alpine AS frontend-builder
WORKDIR /web2life/client

COPY ./client/package.json ./client/package-lock.json ./

RUN npm install

COPY ./client ./

RUN npm run build

FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /web2life/server

COPY ./server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ./server ./

COPY --from=frontend-builder /web2life/client/build /web2life/server/frontend

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver_plus 0.0.0.0:8000 --cert-file cert.crt"]