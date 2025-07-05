# Family Tree Management System

A comprehensive web application for managing family trees with advanced kinship analysis capabilities.

## Features

- **User Authentication**: Secure registration and login system
- **Family Tree Management**: Add, edit, and delete family members
- **Relationship Management**: Define various family relationships (parent-child, marriage, siblings)
- **Visual Tree Display**: Interactive family tree visualization using D3.js
- **Kinship Analysis**: Advanced relationship analysis with gender-aware descriptions
- **Data Export**: Export family tree data in JSON, CSV, and DOT formats
- **Tree Merging**: Merge family trees from different users
- **MongoDB Integration**: Persistent data storage

## Technology Stack

### Backend
- **Flask**: Python web framework
- **MongoDB**: NoSQL database for data persistence
- **JWT**: JSON Web Tokens for authentication
- **CORS**: Cross-origin resource sharing support

### Frontend
- **React**: JavaScript library for building user interfaces
- **D3.js**: Data visualization library for tree rendering
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication

## Installation

### Prerequisites
- Python 3.7+
- Node.js 14+
- MongoDB

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start MongoDB service

6. Run the backend server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login

### Members
- `GET /members` - Get all family members
- `POST /members` - Add new family member
- `PUT /members/<mid>` - Update family member

### Relationships
- `POST /relationships` - Add relationship between members
- `GET /relatives/<mid>` - Get relatives of a member

### Kinship Analysis
- `POST /kinship/relationship` - Get relationship analysis
- `POST /kinship/common_ancestors` - Find common ancestors
- `POST /kinship/bidirectional` - Bidirectional relationship analysis
- `POST /kinship/comprehensive` - Comprehensive kinship analysis

### Data Export
- `GET /export_json` - Export tree as JSON
- `GET /export_csv` - Export tree as CSV
- `GET /export_dot` - Export tree as DOT format

### Tree Operations
- `POST /merge` - Merge trees from different users

## Usage

1. **Register/Login**: Create an account or log in to access the system
2. **Add Family Members**: Use the family tree form to add family members with their details
3. **Define Relationships**: Establish relationships between family members
4. **View Tree**: Visualize your family tree with the interactive tree view
5. **Kinship Queries**: Analyze relationships between any two family members
6. **Export Data**: Export your family tree data in various formats

## Kinship Analysis Features

The system provides advanced kinship analysis with:
- Gender-aware relationship descriptions
- Clear relationship type identification
- Relationship paths for complex connections
- Support for extended family relationships (uncles, aunts, cousins, in-laws)

## Deployment

### Local Development
Both frontend and backend should be running simultaneously:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Production Deployment
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Configure environment variables for production
3. Set up a production MongoDB instance
4. Deploy backend to your preferred hosting service
5. Serve the frontend build files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository. 