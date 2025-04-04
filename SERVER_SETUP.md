# Server Setup Instructions for Gurukul LMS

This document outlines the steps to deploy Gurukul LMS on your production server at knseducation.com/gurukul.

## Prerequisites

- Access to your web server (SSH)
- Node.js (v18 or higher) installed on the server
- Web server (Apache or Nginx) already set up for knseducation.com
- MongoDB access (the connection string should be set in environment variables)

## Deployment Steps

### 1. Deploy the Application Files

Use the provided deployment script:

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script (replace with your actual SSH details)
./deploy.sh username@yourdomain.com /var/www/knseducation.com
```

This will copy all necessary files to `/var/www/knseducation.com/gurukul` on your server.

### 2. Set Environment Variables

On your server, create an environment file:

```bash
ssh username@yourdomain.com
cd /var/www/knseducation.com/gurukul
nano .env.local
```

Add these environment variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

### 3. Configure the Web Server

#### If using Apache:

1. Copy the apache-config.conf file to your server
2. Enable required modules:
   ```bash
   sudo a2enmod proxy proxy_http headers
   ```
3. Include the configuration in your site config:
   ```bash
   sudo cp apache-config.conf /etc/apache2/sites-available/gurukul.conf
   sudo a2ensite gurukul.conf
   sudo systemctl reload apache2
   ```

#### If using Nginx:

1. Copy the nginx-config.conf file to your server
2. Include the configuration in your site config:
   ```bash
   sudo cp nginx-config.conf /etc/nginx/sites-available/gurukul.conf
   sudo ln -s /etc/nginx/sites-available/gurukul.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 4. Set Up as a System Service

1. Copy the service file to the systemd directory:
   ```bash
   sudo cp gurukul.service /etc/systemd/system/
   ```

2. Enable and start the service:
   ```bash
   sudo systemctl enable gurukul.service
   sudo systemctl start gurukul.service
   ```

3. Check service status:
   ```bash
   sudo systemctl status gurukul.service
   ```

## Troubleshooting

- **404 errors**: Check the web server configuration and make sure the proxy is correctly set up
- **API errors**: Verify MongoDB connection and environment variables
- **Startup failures**: Check the application logs using `journalctl -u gurukul.service`

## Updating the Application

To update the application, run the deployment script again: 