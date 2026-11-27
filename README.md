# Sahyog – Co-operative Society Management System

A full-stack web-based Co-operative Society Management System designed to simplify and digitize daily society operations, including member management, savings deposits, loan applications, repayments, transactions, and financial reporting.

The platform provides separate dashboards for Admin, Staff, and Members, helping manage society activities through a centralized system.

**Live Application:** https://society-managment-ga8l.vercel.app

---

## 1. Project Overview

Traditional co-operative societies often manage member information, deposits, loans, and financial records manually. This can lead to paperwork, calculation errors, delayed updates, and difficulty maintaining accurate records.

Sahyog aims to provide a centralized digital platform where administrators and staff can manage society operations while members can access their financial information through their own accounts.

### Project Objectives

- Digitize co-operative society operations.
- Maintain organized member records.
- Simplify savings and deposit management.
- Manage loan applications and repayments.
- Maintain transaction records.
- Provide role-based access to different users.
- Improve transparency and accessibility of financial information.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Token (JWT) |
| Password Security | bcryptjs |
| API Communication | REST APIs |
| Deployment – Frontend | Vercel |
| Deployment – Backend | Render |
| Version Control | Git and GitHub |

---

## 3. Main Features and Modules

### A. Admin Dashboard

The administrator manages the overall society operations.

- Dashboard overview and statistics.
- Staff management.
- Member management.
- Loan application management.
- Loan approval and rejection.
- Deposit and transaction monitoring.
- Financial reports and records.
- Overall society administration.

### B. Staff Dashboard

Staff members handle regular operational activities.

- View and manage member information.
- Assist with deposit management.
- Manage loan-related activities.
- Record and monitor transactions.
- View relevant financial information.
- Support daily society operations.

### C. Member Dashboard

Members can access their own society information.

- Member dashboard.
- View personal account information.
- Check deposit and savings records.
- Apply for loans.
- Track loan application status.
- View loan repayment information.
- Check transaction history.

### D. Loan Management

- Loan application submission.
- Loan application review.
- Approval and rejection workflow.
- Loan repayment and installment tracking.
- Loan-related record management.

### E. Deposit and Savings Management

- Member deposit records.
- Savings information.
- Deposit tracking.
- Financial record management.

### F. Transaction Management

- Maintain transaction records.
- Track financial activities.
- View transaction history.
- Support financial transparency.

### G. Reports and Dashboard Analytics

- Dashboard statistics.
- Society activity overview.
- Financial information summaries.
- Reports for administrative monitoring.

---

## 4. System Architecture

The application follows a client-server architecture.

**Frontend:** React and Vite provide the user interface, dashboards, forms, and user interactions.

**Backend:** Node.js and Express.js handle API requests, business logic, authentication, and database operations.

**Database:** MongoDB Atlas stores application data using Mongoose models.

**Authentication:** JWT-based authentication is used to authenticate users and protect authorized routes.

### Application Flow

```text
             USER
               |
               v
       React Frontend
          (Vite)
               |
               v
       Express REST APIs
               |
               v
       Authentication
          (JWT)
               |
               v
        Business Logic
               |
               v
        Mongoose ODM
               |
               v
        MongoDB Atlas
```

---

## 5. User Roles

The application supports three primary user roles:

| Role | Responsibility |
|---|---|
| Admin | Overall system and society management |
| Staff | Daily operational and financial activities |
| Member | Access personal information and society services |

Role-based access helps ensure users access the functionality relevant to their responsibilities.

---

## 6. Security Features

The backend incorporates security measures including:

- **JWT Authentication:** Token-based user authentication.
- **Password Hashing:** bcryptjs for securely hashing passwords.
- **Protected Routes:** Authentication middleware for restricted API access.
- **Role-Based Authorization:** Access control based on user roles.
- **Helmet:** HTTP security headers.
- **Rate Limiting:** Helps protect APIs against excessive requests.
- **CORS Configuration:** Controls permitted frontend origins.
- **Environment Variables:** Keeps sensitive configuration outside source code.

---

## 7. Project Folder Structure

The main application is organized into separate frontend and backend directories.

```text
society-managment/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vercel.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── package.json
├── .gitignore
└── README.md
```

*Note: This is the logical project structure. Individual files may vary depending on the current implementation.*

---

## 8. Installation and Local Setup

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- MongoDB Atlas account
- Visual Studio Code

### Step 1: Clone the Repository

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd society-managment
```

### Step 2: Install Backend Dependencies

```bash
npm install
```

### Step 3: Configure Backend Environment Variables

Create a `.env` file in the root directory.

Example:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h

CLIENT_URL=http://localhost:5173

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

Replace the example values with your actual configuration. Email variables are only needed if the corresponding email functionality is enabled.

### Step 4: Install Frontend Dependencies

```bash
cd client
npm install
```

### Step 5: Start the Frontend

From the root directory:

```bash
npm run client
```

Alternatively:

```bash
cd client
npm run dev
```

The frontend will run at:

http://localhost:5173

### Step 6: Start the Backend

Open another terminal in the project root:

```bash
node server/server.js
```

The backend will run on the configured port, typically:

http://localhost:5000

---

## 9. Deployment

The application is deployed using Render and Vercel.

### Backend Deployment – Render

1. Create a Web Service on [Render](https://render.com/).
2. Connect the GitHub repository.
3. Configure the following settings:

| Setting | Value |
|---|---|
| Root Directory | `.` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server/server.js` |

4. Configure the required environment variables:

```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=24h
NODE_ENV=production
CLIENT_URL=https://society-managment-ga8l.vercel.app
```

5. Deploy the backend.
6. Copy the generated Render service URL.

### Frontend Deployment – Vercel

1. Open [Vercel](https://vercel.com/).
2. Import the GitHub repository.
3. Configure the project:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Add the environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

Replace the example URL with your actual Render backend URL.

5. Deploy the frontend.

**Live Application:** https://society-managment-ga8l.vercel.app

---

## 10. Future Enhancements

The following features can be added in future versions to improve the platform.

### 1. Financial Automation

- UPI payment gateway integration using Razorpay or Cashfree.
- Automated EMI collection.
- Direct bank integration through supported banking APIs.
- Automated payment receipts and transaction verification.

### 2. AI and Data Analytics

- Machine-learning-based credit scoring.
- Predictive loan default analysis.
- Financial trend analysis and forecasting.
- AI-powered chatbot for member support.
- Automated financial insights and reporting.

### 3. Advanced Security

- Two-factor authentication (2FA).
- OTP verification for sensitive transactions.
- Digital KYC integration.
- Maker-checker approval workflow.
- Biometric authentication.

### 4. Mobile Application

- Dedicated Android and iOS applications.
- Mobile access for society members.
- Field collection agent application.
- Offline transaction recording with synchronization.

### 5. Communication and Accessibility

- Automated SMS and WhatsApp notifications.
- EMI due-date reminders.
- Loan application status notifications.
- Multi-language support, including Gujarati, Hindi, and English.

---

## 11. Project Benefits

- Reduces manual paperwork.
- Centralizes society information.
- Improves accessibility of member records.
- Simplifies loan and deposit management.
- Provides organized transaction records.
- Supports better administrative monitoring.
- Provides a foundation for future digital financial services.

---

## 12. Conclusion

Sahyog – Co-operative Society Management System provides a digital solution for managing the essential operations of a co-operative society.

By combining a React-based frontend, Node.js and Express backend, and MongoDB database, the platform offers a centralized environment for administrators, staff, and members.

The project demonstrates the practical application of full-stack web development, database management, REST API development, authentication, and cloud deployment.

It can be further enhanced with payment automation, AI-based analytics, mobile applications, and advanced security features.

---

## 13. Project Information

| Detail | Information |
|---|---|
| Project Name | Sahyog – Co-operative Society Management System |
| Project Type | Full-Stack Web Application |
| Degree | B.Tech – Computer Engineering |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database | MongoDB Atlas |
| Version Control | GitHub |
| Live URL | https://society-managment-ga8l.vercel.app |

---

**Note:** This README describes the current project and proposed future enhancements separately. Actual features and environment configuration should be checked against the deployed code before release.
