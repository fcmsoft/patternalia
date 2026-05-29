# Patternalia 🧶

A personal knitting, crochet, embroidery & cross-stitch pattern library. Upload PDFs, organise them into categories, add metadata, and link to Ravelry or Pinterest.

## Tech Stack

- **Angular 21** — standalone components, signals, OnPush
- **Tailwind CSS + PrimeNG** — styling and UI components
- **AWS Amplify v6 + Cognito** — authentication
- **AWS API Gateway + Lambda + DynamoDB** — REST API for patterns & categories
- **AWS S3** — PDF storage via presigned URLs
- **Ravelry API** — proxied pattern search & linking

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure AWS

We are using AWS Amplify so you need to download your amplify_outputs.json and save it on src folder.

### 3. Start the dev server

```bash
npm start
```

Navigate to `http://localhost:4200/`.

## Building

```bash
npm build
```

## Running tests

```bash
npm test
```

## Project Structure

```
src/app/
├── core/
│   ├── auth/          # AuthService (Cognito via Amplify)
│   ├── guards/        # authGuard
│   ├── interceptors/  # JWT Bearer token interceptor
│   └── models/        # Pattern, Category interfaces
├── features/
│   ├── auth/          # Login, Register, Confirm, ForgotPassword
│   ├── categories/    # Categories CRUD
│   └── patterns/      # List, Upload, Detail, Edit
└── shared/
    ├── components/    # Shell, PdfViewer, ConfirmDialog, EmptyState
    └── services/      # ApiService, StorageService, RavelryService
```

## AWS Infrastructure (to provision)

| Resource             | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| Cognito User Pool    | Authentication                                           |
| S3 Bucket            | PDF storage (`{userId}/patterns/{patternId}.pdf`)        |
| API Gateway + Lambda | REST API                                                 |
| DynamoDB             | `patternalia-patterns` + `patternalia-categories` tables |
| Secrets Manager      | Ravelry API key (accessed by Lambda only)                |
