git pull origin main
# sudo systemctl stop mongod
npm run build
npm run copy-templates
# sudo systemctl start mongod
# sudo systemctl status mongod
pm2 reload osmo && pm2 logs osmo
