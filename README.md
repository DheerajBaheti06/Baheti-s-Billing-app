# Baheti Billing App

A polished, lightweight, and high-performance mobile-first invoicing and ledger application optimized for daily retail operations. Built specifically for Baheti's Maheshwari Gruhasthi Udyog, the application delivers rapid bill generation, real-time sales auditing, and robust standalone installation capabilities.

---

## 📱 Features & Capabilities

### 1. Dynamic Analytics Dashboard
* **Time-Series Date Filtering:** Real-time metrics can be filtered dynamically across pre-set ranges:
  * *Today*
  * *Last 7 Days*
  * *Last 30 Days*
  * *This Month*
  * *Last Month (complete ledger month)*
  * *This Year*
  * *All-Time Cumulative Data*
* **Dynamic Sales Counting:** Instant indicators displaying net sales revenue paired with automated invoice counting.
* **Bank Received Ledger:** Monitor real-time payment volumes categorized as **Direct Bank Transfers** or digital collections. Clicking the widget automatically navigates to history with the Bank filter preset.
* **Outstanding Balances:** Monitor cumulative pending bills. Clicking the outstanding widget navigates to your billing records with the Pending filter instantly pre-applied.
* **Smart Catalog Shortcut:** Rapid access widgets to view and navigate products, items list, and total invoices.
* **Top Selling Products:** Performance rank lists displaying your most revenue-driving inventory items.

### 2. Fast Billing & Draft Generator
* **Interactive Cart Engine:** Quick product counters, dynamic pricing multipliers, custom customer metadata fields (Name, Phone number), and multi-tax or discount fields.
* **Draft Auto-Retention:** Draft bills are persistently saved locally. Pause mid-sale and pick up working drafts from any screen without missing active orders.
* **Receipt Formatter:** Instant professional, print-ready, clean receipts optimized for high-contrast viewing and print shares.

### 3. History Logs & Audit Ledger
* **Invoice Triage:** Filter and organize payments across status classifications: Paid, Pending, or direct Bank transfer.
* **Responsive Search:** Instant search filters across customer names, contact numbers, order dates, or specific bill totals.
* **Historical Correction:** Full support for updating and correcting existing invoices or removing errors seamlessly.

### 4. Role-based Security & Access
* **Administrative Protection:** Restricted screens can only be accessed by inputting a secure, hashed 4-digit master MPIN.
* **Guest / Staff Viewing Mode:** Staff can easily lookup product catalog lists, retail prices, and stock updates without edit privileges or exposure to raw transaction log histories.

### 5. Seamless Preferences Settings
* **Branding Labels:** Personalize metadata variables, localized company branding labels, and tax parameters dynamically.
* **Aesthetic Themes:** Clean light canvas optimized for high legibility under direct shop illumination, with multi-color accent pickers (Orange, Violet, Emerald, Navy).
* **Responsive Typography:** Switch effortlessly between modern structural geometric layouts, technical high-density typography, or editorial serifs.
* **Internationalized Languages:** Fully localized text interfaces in:
  * 🇬🇧 English
  * 🇮🇳 Hindi (हिन्दी)
  * ✏️ Hinglish (Hindi written in Roman characters)

### 6. Progressive Web App (PWA) Installable
* Fully configured service worker cache matching native mobile applications.
* Single-click home page installer integrated natively within user Settings.
* Offline support ensuring consistent access to catalogs and offline draft creations.
* Customized beautiful SVG application vector graphics and high-fidelity manifest icons.

---

## 🏗️ Technology Stack

* **Frontend Framework:** React 18+ with Vite
* **Programming Language:** TypeScript
* **Design & Styling:** Tailwind CSS
* **Animation Engine:** Motion (`motion/react`)
* **State Management:** Custom React Context Providers
* **Local Date Managers:** `date-fns` & standard JS local state engines
* **Platform Security:** Secure MPIN encryption algorithms

---

## 🚀 Get Started (Local Setup)

To run or build the application locally, follow these standard steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```
   *The dev server runs on `http://localhost:3000`.*

### Building for Production
1. Compile and bundle assets for optimized, lightning-fast static serving:
   ```bash
   npm run build
   ```

2. Start the production preview build locally:
   ```bash
   npm run start
   ```

---

## 📈 System Screenshots & Assets

> *Placeholder blocks for screenshots — User can upload system mockups here in the future.*

#### Application Launcher Icon
![Application Icon](./public/icon.svg)

#### Dashboard Performance Overview
*<!-- Add dashboard_mobile.png here -->*

#### Responsive Billing Screen
*<!-- Add billing_interface.png here -->*

---

Designed with 🧡 for Baheti's Maheshwari Gruhasthi Udyog.
