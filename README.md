# CV Builder AI Chatbot

**CV Builder AI Chatbot** (mytender.io) is an advanced, AI-powered platform designed to streamline the creation of professional CVs, proposals, and tender documents. It leverages state-of-the-art AI to assist users in generating, refining, and managing content, making the bid and proposal process faster, smarter, and more collaborative.

## Mission

Empower organizations and individuals to win more business by automating and enhancing the proposal and CV creation process with cutting-edge AI, intuitive workflows, and seamless integrations.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **Framework:** React (TypeScript)
- **UI Libraries:** MUI (Material UI), Bootstrap, Fluent UI, FontAwesome
- **State & Routing:** React Router, React Context, Local Storage
- **Testing:** Vitest, Jest, Testing Library
- **Build Tools:** Vite, Webpack

### Backend
- **Framework:** Django 5 (Python 3.10+)
- **Async/Websockets:** Daphne, Channels
- **Storage & File Handling:** django-storages, boto3 (AWS S3), Whitenoise
- **Email & Notifications:** django-ses, sib-api-v3-sdk (Sendinblue)
- **PDF/Doc Generation:** reportlab, xhtml2pdf, docx, mammoth
- **Payments:** Stripe

### Office Add-in (Wordpane)
- **Framework:** React (TypeScript)
- **Office Integration:** Office.js, Office-Addin-TaskPane-React
- **UI Libraries:** Fluent UI, MUI, Bootstrap

### DevOps & Tooling
- **Containerization:** Docker, Docker Compose
- **Dependency Management:** Poetry (Python), npm/yarn (Node)
- **Linting & Formatting:** ESLint, Prettier, Flake8, Pre-commit
- **CI/CD:** Makefile, Husky, Pre-commit hooks

### Analytics & Monitoring
- **User Analytics:** PostHog, Google Analytics (react-ga4)

---

## 🌐 Third-Party Services

- **AWS S3**: Document storage
- **Sendinblue**: Transactional email
- **Stripe**: Payment processing
- **PostHog**: Product analytics
- **Google Analytics**: User tracking

---

## 🧩 Key Features

- **AI-Powered Q&A and Proposal Generation:** Instantly generate, refine, and edit answers and proposal sections using advanced AI.
- **Bid Pilot Copilot:** Contextual AI assistant for refining answers, searching the internet, or querying your document library.
- **Content Library:** Securely upload, organize, and search company documents to power AI responses.
- **Interactive Wizards:** Step-by-step onboarding and guidance for new users.
- **Bid Management:** Track, create, and manage bids with Kanban and table views.
- **Office Add-in:** Seamless integration with Microsoft Word for in-app AI assistance.
- **User Roles & Collaboration:** Assign contributors, manage permissions, and collaborate in real-time.
- **Secure & Compliant:** Data security best practices, role-based access, and audit trails.

---

## 🏗️ Workflow & User Journey

1. **Sign Up / Login:** Secure authentication and onboarding wizard.
2. **Dashboard:** Central hub to access proposal writing, chat, bid/no-bid calculator, and company library.
3. **Content Library:** Upload and organize documents to build your knowledge base.
4. **Ask Questions:** Use the AI chatbot to query your library or the internet for instant answers.
5. **Proposal Planning:** Use the Proposal Planner to structure, generate, and refine proposal sections with AI.
6. **Bid Management:** Create, track, and manage bids through their lifecycle.
7. **Office Add-in:** Use the Wordpane Copilot for in-document AI assistance.
8. **Export & Submit:** Generate polished documents for submission.

---

## ⚙️ Configuration & Deployment

### Prerequisites

- Node.js (v16+), npm or yarn
- Python 3.10+
- Docker & Docker Compose (for production/development containers)
- AWS credentials (for S3), Sendinblue API key, Stripe API key

### Environment Variables

- Configure environment variables for Django, React, and Office Add-in as needed (see `.env.example` or relevant config files).

### Local Development

#### Frontend

```bash
cd src
npm install
npm run dev
```

#### Backend

```bash
cd website
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

#### Office Add-in

```bash
cd wordpane
npm install
npm run start
```

#### All-in-One (Docker)

```bash
cd website
docker-compose up --build
```

---

## 🚦 Running Guide

1. **Clone the repository**
2. **Install dependencies** for each component (`src`, `website`, `wordpane`)
3. **Configure environment variables** for API keys and secrets
4. **Run backend and frontend** (see above)
5. **Access the app** at `http://localhost:8000` (backend) and `http://localhost:5173` (frontend, default Vite port)
6. **For Office Add-in:** Sideload the manifest in Word or use `npm run start` in `wordpane`
7. **Use the onboarding wizard** for a guided tour

---

## 🚢 Production Deployment

- Use Docker Compose for orchestrated deployment.
- Configure production environment variables and secrets.
- Use `docker-compose -f docker-compose.yml up --build` in the `website` directory.
- Set up a reverse proxy (e.g., Nginx) and SSL as needed.

---
