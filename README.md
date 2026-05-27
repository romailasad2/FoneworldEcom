# FoneWorld E-Commerce Website

A modern, responsive e-commerce website for a mobile phone store with 16 branches. Features advanced search, filtering, real-time inventory display, and a complete admin panel for product management.

## Features

- 🏪 **16 Branch Management** - View products across all 16 store branches
- 🔍 **Advanced Search** - Search by name, brand, color, or description
- 🎯 **Smart Filters** - Filter by price range, brand, storage, and branch
- 📱 **Product Inventory** - Real-time stock display for each product
- 🎨 **Red & White Theme** - Beautiful, modern design with red and white color scheme
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- ⚡ **Fast Performance** - Built with React and Vite for optimal performance
- 🔐 **Admin Panel** - Complete CRUD operations for product management
- 💾 **SQLite Database** - Persistent data storage with SQLite
- 🔒 **JWT Authentication** - Secure admin login system

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with CSS variables

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd server
npm install
cd ..
```

3. **Set up environment variables (optional):**

Create a `server/.env` file (optional, defaults work fine):
```env
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

### Running the Application

**IMPORTANT: You need TWO terminal windows - one for backend, one for frontend!**

#### Terminal 1 - Start Backend Server:
```bash
cd server
npm start
```

You should see:
```
Server running on http://localhost:5000
API endpoints available at http://localhost:5000/api
Connected to SQLite database
Database initialized successfully
```

#### Terminal 2 - Start Frontend (in root directory):
```bash
npm run dev
```

#### Access the Application:
- **Frontend (Public)**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Default Admin Credentials**:
  - Username: `admin`
  - Password: `admin123`

### Troubleshooting Login Issues

If you see "Failed to fetch" or "Cannot connect to server" error:

1. ✅ **Check if backend is running**: Open http://localhost:5000/api/health in your browser
   - Should show: `{"status":"OK","message":"FoneWorld API is running"}`
   - If you get an error, the backend is not running

2. ✅ **Make sure backend dependencies are installed**:
   ```bash
   cd server
   npm install
   ```

3. ✅ **Check the backend terminal** for any error messages

4. ✅ **Verify port 5000 is not in use** by another application

See `SETUP.md` for detailed troubleshooting guide.

### Build for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
The server runs with `npm start` in the server directory.

## Project Structure

```
foneworld-ecom/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Navigation header
│   │   ├── ProductListing.jsx      # Main product listing page
│   │   ├── ProductCard.jsx         # Individual product card
│   │   ├── FilterPanel.jsx          # Filter sidebar
│   │   └── Admin/
│   │       ├── Login.jsx           # Admin login page
│   │       ├── Dashboard.jsx       # Admin dashboard
│   │       ├── ProductForm.jsx     # Product create/edit form
│   │       └── ProtectedRoute.jsx  # Auth protection
│   ├── services/
│   │   └── api.js                  # API service layer
│   ├── data/
│   │   └── products.js             # Static data (fallback)
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── server/
│   ├── routes/
│   │   ├── auth.js                 # Authentication routes
│   │   ├── products.js             # Product CRUD routes
│   │   └── branches.js             # Branch routes
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── database.js                 # Database setup and models
│   ├── server.js                   # Express server
│   └── package.json                # Backend dependencies
├── index.html
├── package.json
└── vite.config.js
```

## Features in Detail

### Public Features
- **Search Functionality**: Real-time search across product names, brands, colors, and descriptions
- **Filtering System**: 
  - Price Range: Slider and input fields for price filtering
  - Brand Filter: Multi-select checkboxes for all available brands
  - Storage Filter: Filter by storage capacity (128GB, 256GB, 512GB, 1TB)
  - Branch Filter: Filter products by specific store branches
- **Product Display**: Product cards with images, ratings, and specifications
- **Stock Indicators**: Color-coded stock availability (In Stock, Low Stock, Very Low Stock)
- **Sorting Options**: Sort by name, price, rating, or stock availability

### Admin Features
- **Secure Login**: JWT-based authentication
- **Product Management**: 
  - Create new products
  - Edit existing products
  - Delete products
  - View all products in a table
- **Real-time Updates**: Changes reflect immediately on the public site
- **Branch Management**: Products linked to branches automatically

## API Endpoints

### Public Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/branches` - Get all branches

### Admin Endpoints (Requires Authentication)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## Branches

The website includes 16 branches:
1. FoneWorld Derby
2. FoneWorld Peterborough
3. FoneWorld Colchester
4. FoneWorld Westfield London
5. FoneWorld Poole
6. FoneWorld Bath
7. FoneWorld Bluewater
8. FoneWorld Bracknell
9. FoneWorld Bournemouth
10. FoneWorld Weymouth
11. FoneWorld Dorchester
12. FoneWorld Oxford
13. FoneWorld Witney
14. FoneWorld Merry Hill
15. iAccessories Bournemouth
16. FoneTech Poole

## Database

The application uses SQLite3 database (`server/foneworld.db`) with the following tables:
- `products` - Product information
- `branches` - Store branch information
- `admin_users` - Admin user accounts

The database is automatically created and initialized with sample data on first run.

## Customization

### Adding Products
Use the admin dashboard at `/admin/dashboard` to add, edit, or delete products.

### Modifying Colors
Edit CSS variables in `src/index.css`:
- `--primary-red`: Main red color
- `--primary-red-dark`: Darker red for hover states
- `--primary-red-light`: Lighter red variant

### Changing Admin Password
The default admin password is stored in the database. You can change it by:
1. Logging into the admin panel
2. Using a database tool to update the `admin_users` table
3. Or modify the database initialization in `server/database.js`

## License

This project is open source and available for use.
