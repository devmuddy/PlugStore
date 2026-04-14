# Admin Creation Script

This script creates an admin account for the application by prompting for credentials in the terminal.

## Usage

Run the script using npm:

```bash
npm run create-admin
```

The script will prompt you to enter:
- **Email** - Admin email address
- **Username** - Admin username (must be at least 3 characters)
- **Password** - Admin password (must be at least 6 characters, hidden input)

## Example

```bash
$ npm run create-admin

✅ Connected to MongoDB

Please enter admin account details:

Email: admin@luxcart.com
Username: admin
Password: ********

✅ Admin account created successfully!

📋 Admin Credentials:
   Email: admin@luxcart.com
   Username: admin

⚠️  Please keep your password secure!
```

## Notes

- The script will skip creation if an admin with the same email already exists
- The admin email will be automatically verified
- Password input is hidden for security
- Make sure your MongoDB connection is configured in `.env` before running

