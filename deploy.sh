#!/bin/bash

# This script deploys the Gurukul LMS to a production server
# Usage: ./deploy.sh username@server.com /path/to/webroot

# Check if parameters are provided
if [ $# -lt 2 ]; then
  echo "Usage: ./deploy.sh username@server.com /path/to/webroot"
  exit 1
fi

SSH_HOST=$1
WEB_ROOT=$2
DEPLOY_PATH="${WEB_ROOT}/gurukul"

echo "Building application..."
npm run build

echo "Creating deployment package..."
rm -rf deploy-package
mkdir -p deploy-package

# Copy Next.js build output and necessary files
cp -r .next deploy-package/
cp -r public deploy-package/
cp package.json deploy-package/
cp next.config.js deploy-package/
cp -r node_modules deploy-package/

echo "Creating deployment script..."
cat > deploy-package/startup.sh << 'EOF'
#!/bin/bash
npm start
EOF
chmod +x deploy-package/startup.sh

echo "Deploying to $SSH_HOST:$DEPLOY_PATH..."
ssh $SSH_HOST "mkdir -p $DEPLOY_PATH"
rsync -avz --delete deploy-package/ $SSH_HOST:$DEPLOY_PATH/

echo "Setting up server..."
ssh $SSH_HOST "cd $DEPLOY_PATH && chmod +x startup.sh"

echo "Deployment complete!"
echo "To start the application, run:"
echo "  ssh $SSH_HOST \"cd $DEPLOY_PATH && ./startup.sh\""

# Clean up
rm -rf deploy-package 