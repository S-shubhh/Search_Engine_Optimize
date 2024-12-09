Travel Query Encryption Application
Overview
This project is a secure travel query application that encrypts user queries on the frontend using RSA encryption, transmits the encrypted data to the backend, and decrypts it on the server. It features a modern, visually appealing interface with animations and robust security for user data.

Features
🔒 RSA-based end-to-end encryption for secure data transmission.
🎨 Responsive and aesthetically pleasing UI built with Tailwind CSS.
✨ Animations for enhanced user experience.
🌐 API endpoints to handle encryption and decryption securely.
Technologies Used
Frontend:
React
Tailwind CSS
Backend:
Node.js
Express
Security:
RSA Encryption (Node.js crypto module)
Setup Instructions
1. Clone the Repository
bash
Copy code
git clone https://github.com/your-username/travel-query-encryption.git  
cd travel-query-encryption  
2. Install Dependencies
Frontend
bash
Copy code
cd client  
npm install  
Backend
bash
Copy code
cd server  
npm install  
3. Configure RSA Keys
Generate RSA key pair:
bash
Copy code
openssl genrsa -out private_key.pem 2048  
openssl rsa -in private_key.pem -pubout -out public_key.pem  
Place the private_key.pem and public_key.pem files in the server/keys directory.
Run the Application
1. Start the Backend Server
bash
Copy code
cd server  
node index.js  
2. Start the Frontend
bash
Copy code
cd client  
npm start  
The application will be accessible at http://localhost:3000.

API Endpoints
GET /public_key.pem
Description: Serves the public key for frontend encryption.
POST /decrypt
Description: Decrypts the received encrypted data and returns the plaintext.
Request Body:
json
Copy code
{  
  "encryptedData": "base64-encoded-encrypted-string"  
}  
Response Body:
json
Copy code
{  
  "message": "Decryption successful",  
  "data": "decrypted string"  
}  
Future Enhancements
🌍 Integration with Google Spatial Location APIs for advanced query results.
📈 Scalable API structure and backend logic.
🛡️ Additional security measures like rate-limiting and query logging.
Contributors
Shubham
