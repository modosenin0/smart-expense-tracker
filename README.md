# 💰 Smart Expense Tracker

🚀 **A secure, full-stack expense tracking web application** with **React, Node.js, Express, and PostgreSQL**.  
Deployed on **Azure** with **complete security automation** using **Azure Key Vault, Managed Identity, and Application Insights**.  
✨ **Zero manual secret management** - all credentials are automatically generated and securely stored in the cloud!

---

## 🚀 Features

### 💰 Core Features
- 🔐 **Secure user authentication** with JWT
- 📂 **Smart categories** for organizing expenses
- 💱 **Multi-currency support** (auto-conversion to GBP)
- 📊 **Advanced analytics dashboard**:
  - Spending by category
  - Monthly spending trends
  - Top spending categories

### 🔒 Enterprise Security (100% Automated!)
- 🔐 **Azure Key Vault integration** - All secrets stored securely
- 🎯 **Managed Identity authentication** - No credentials in code
- 🔄 **Automatic secret rotation** - Database passwords auto-generated
- � **Application Insights monitoring** - Full observability
- ✅ **Zero manual configuration** - Everything automated!

### ☁️ Azure Cloud Infrastructure
- 🌍 **Azure App Service** - Scalable backend hosting
- 🗄️ **Azure PostgreSQL Flexible Server** - Managed database
- 🎯 **Azure Static Web Apps** - Frontend hosting
- 📈 **Application Insights** - Real-time monitoring

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
cp .env.example .env   
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```