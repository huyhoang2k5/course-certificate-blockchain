# EduCert Chain

EduCert Chain is a course marketplace and certificate verification demo using React, Node.js/Express, MongoDB, MetaMask, Ganache, and a Solidity smart contract.

## Main Features

- Register and log in with email, password, and MetaMask wallet.
- Separate admin and learner pages.
- Admin can add/delete courses, issue certificates, view users, sales, revenue, and issued certificates.
- Learners can buy courses with ETH, view purchased courses, verify certificates, and export certificates to PDF.
- MongoDB stores user, course, sale, and certificate data. Blockchain stores key course purchase and certificate verification records.

## Project Structure

```text
client/      React frontend
server/      Express + MongoDB backend
contracts/   Solidity smart contract
migrations/  Truffle migrations
scripts/     Utility sync scripts for local Ganache resets
```

## Setup

1. Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

2. Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:3000
ADMIN_WALLET_ADDRESS=your_ganache_admin_wallet
```

Do not commit `server/.env`.

3. Start Ganache on `127.0.0.1:7545`, then deploy the contract:

```bash
truffle migrate --reset --network development
```

4. Copy the latest artifact to the React app if needed:

```bash
copy build\contracts\CourseCertificate.json client\src\contracts\CourseCertificate.json
```

5. Seed the fixed admin account:

```bash
cd server
npm run seed:admin
```

Default admin:

```text
Email: admin123@gmail.com
Password: admin123
```

The admin must use the MetaMask wallet configured in `ADMIN_WALLET_ADDRESS`.

6. Run the app:

```bash
cd server
npm run dev

cd ../client
npm start
```

Frontend: `http://localhost:3000`

Backend health check: `http://localhost:5000/api/health`

## Notes

- Ganache is local. If the workspace is reset, run migrate again.
- Courses and certificates can be synced back from MongoDB with:

```bash
truffle exec scripts/sync_courses_from_api.js --network development
truffle exec scripts/sync_certificates_from_api.js --network development
```
