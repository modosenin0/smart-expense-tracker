# 💰 Smart Expense Tracker

A full-stack expense tracking web application with **React, Node.js, Express, and PostgreSQL**.  
Deployed on **Azure App Service** (backend), **Azure PostgreSQL Flexible Server** (database), and **Azure Static Web Apps** (frontend).  
Includes **multi-currency support**, **analytics dashboards**, and **Application Insights monitoring**.

---

## 🚀 Features

- 🔐 User authentication with JWT
- 📂 Categories for organizing expenses
- 💱 Multi-currency support (auto-conversion to GBP via ExchangeRate API)
- 📊 Analytics dashboard:
  - Spending by category
  - Monthly spending trends
  - Top categories
- ☁️ Fully deployed on **Azure**
- 📈 Observability with **Application Insights**
- ✅ Tested with Jest + Supertest

---

## 🖼️ Demo

- **Frontend**: [https://smart-expense-tracker-ui.azurestaticapps.net](https://ambitious-bay-055468303.1.azurestaticapps.net/login)  
- **API**: [https://smart-expense-tracker-api.azurewebsites.net](https://smart-expense-tracker-api.azurewebsites.net)

---

## 🛠️ Tech Stack

### Frontend

- React + TailwindCSS
- React Router
- Chart.js

### Backend

- Node.js + Express
- PostgreSQL (Azure Flexible Server)
- JWT Authentication
- Application Insights

### DevOps / Deployment

- Azure App Service
- Azure Static Web Apps
- Azure PostgreSQL Flexible Server
- GitHub Actions CI/CD

---

## 📦 Getting Started (Local)

### 1. Clone Repo

```bash
git clone https://github.com/yourusername/smart-expense-tracker.git
cd smart-expense-tracker
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL + JWT_SECRET
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```