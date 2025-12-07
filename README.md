UniMart is a web-based "Campus Marketplace" developed to solve the problem of unorganized buying and selling of resources within a college environment. Unlike public platforms like OLX or Quikr, UniMart is restricted to students of the institute (VJTI), creating a trusted and secure ecosystem.

The platform allows students to list used items such as engineering textbooks, drafters, scientific calculators, and electronics. Buyers can search for items by category and connect directly with sellers via WhatsApp integration, eliminating middlemen and commission fees. The system features secure user authentication with institute-specific registration to ensure that only verified students form the community.

3. Key Features List :

Lazy Registration: Users can browse the catalog without logging in. Authentication is only required for high-intent actions like "Selling" or "Contacting Sellers".

Advanced Search & Filters: Real-time filtering by categories (Electronics, Books, Stationery) and keyword search.

Image Uploads: Sellers can upload real photos of their products (handled via Multer for local storage).

WhatsApp Integration: A "Chat with Seller" button automatically redirects potential buyers to WhatsApp with a pre-configured message including the item name.

## 💻 How to Run This Project (Simple Guide)

Follow these steps to get the UniMart website running on your laptop.

### 1. Install Necessary Tools
Before you start, make sure you have these two programs installed:
* **Node.js:** (Download from https://nodejs.org) - Use the **LTS Version** (v18 or higher).
* **VS Code:** (Download from https://code.visualstudio.com) - This is where you edit and run the code.

---

### 2. Download the Project
1.  Download this project as a ZIP file (or clone it using Git).
2.  Unzip it and open the folder in **VS Code**.

---

### 3. Setup the Backend (The "Brain" of the App)
The backend needs some libraries to work.
1.  Open VS Code.
2.  Open the Terminal (Click `Terminal` -> `New Terminal` in the top menu).
3.  Type these commands one by one and press Enter:

    ```bash
    cd server
    npm install
    ```
    *(Wait for it to finish downloading).*

---

### 4. Start the Server
Now, let's turn on the backend.
1.  In the same terminal (make sure you are still inside the `server` folder), type:

    ```bash
    nodemon server.js
    ```
    *(If that doesn't work, try `node server.js`)*

2.  You should see a message saying: **"✅ MongoDB Connected"**. Do not close this terminal!

---

### 5. Open the Website (The "Face" of the App)
1.  Go to your project folder -> `client`.
2.  Find the file named `index.html`.
3.  **Right-click** on `index.html` and select **"Open with Live Server"** (if installed) or simply double-click it to open in Chrome.

🎉 **Done! The website should now be working.**
