# Decred Dashboard

See live version here: http://dcrstats.com
### Requirements
- Node.js >= 4.2.6
- Postgresql >= 9.3.10
- Decred software: dcrd, dcrwallet, dcrctl
- (optional) Nginx for production env (static files delivery)

### Installation and configuration
Clone this repository:
```
git clone https://github.com/Dyrk/decred-dashboard.git
```

Install all dependencies:
```
npm install
```

Rename file 'config/config.json.sample' to 'config/config.json' and fill it with your correct Postgres database credentials.

Now you need Sequelize-CLI and PM2 installed globally:
```
npm install -g pm2
npm install -g sequelize-cli
```
Migrate database (if you will not specify NODE_ENV, sequelize will use configs for "development"):
```
NODE_ENV=production sequelize db:migrate
```
Application use some of the dcrctl commands to get new data, executing them with the ('child_process').exec().

Probably you need to check this commands and specify full path to dcrctl and all necessary flags, if you didn't yet configure everything on your machine.
Check server.js file:
```
exec("dcrctl getrawmempool", function(error, stdout, stderr) { ... });
exec("dcrctl getmininginfo", function(error, stdout, stderr) { ... });
exec("bash ./parseblocks.sh " + height, function(error, stdout, stderr) { ... });
```
If you are using Windows, probably you need also rewrite content of "parseblocks.sh" file to some Windows .bat file, but don't be afraid, there are only 3 lines inside.

Well, now you can run application with PM2:
```
pm2 start package.json
```
If everything ok, cronjobs will start all parsers in the next 1-5 minutes, which will fill your database with real data. If you don't see still anything interesting on localhost:8080, you can track application logs with "pm2 logs 0" command.

### Pull requests
Decred Dashboard is still in early stage of development. Feel free to ask us for implementation of any new features or just do it yourself, we will be happy to see your pull requests.
