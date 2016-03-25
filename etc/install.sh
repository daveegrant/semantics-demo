#!/bin/sh

sudo npm -g install bower
sudo npm -g install gulp
sudo npm -g install forever

cd ..
npm install
bower install
gulp build

cd /etc
sudo ln -s /space/projects/semantic-demo.live/etc/prod semantic-demo
cd /etc/init.d
sudo ln -s /space/projects/semantic-demo.live/etc/init.d/node-express-service semantic-demo
sudo chkconfig --add semantic-demo
sudo chkconfig --levels 2345 semantic-demo on
