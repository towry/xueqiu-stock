require('electron-debug')({showDevTools: true});

var electron = require('electron');
var menubar = require('menubar');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var request = require('request').defaults({jar: true});
var ipc = electron.ipcMain;
var shell = electron.shell;

var menu = menubar({
  dir: __dirname,
  preloadWindow: true,
  width: 350,
  height: 370,
  icon: path.join(__dirname, 'images', 'Icon.png')
});

var conf = loadConfig();

menu.on('ready', function ready() {

  menu.app.on('will-quit', function tryQuit(e) {
    menu.window = undefined;
    e.preventDefault();
  });

  ipc.on('terminate', function terminate() {
    menu.app.quit();
  });

  ipc.on('open-dir', function openDir() {
    shell.showItemInFolder(path.join(conf.exec.cwd, 'config.json'));
  });

  var refreshTimer = null;
  menu.on('show', function() {
    console.log('register refresh timer');
    refreshTimer = setInterval(getStocks, 30000);
  });

  menu.on('hide', function() {
    console.log('clear refresh timer');
    clearInterval(refreshTimer);
  });
});

menu.on('after-create-window', function() {
  console.log('after create window');
  getStocks();
});


function loadConfig() {
  var dir = path.join(menu.app.getPath('userData'), 'data');
  var configFile = dir + '/config.json';
  var conf, data;

  try {
    data = fs.readFileSync(configFile);
  } catch (e) {
    if (e.code === 'ENOENT') {
      fs.mkdirSync(dir);
      fs.writeFileSync(configFile, fs.readFileSync(__dirname + '/config.json'));
      return loadConfig();
    } else {
      throw e;
    }
  }

  try {
    conf = JSON.parse(data.toString());
  } catch (e) {
    throw new Error('Invalid configuration file');
  }

  conf.exec = {
    cwd: dir
  };
  return conf;
}

function getStocks() {
  console.log('reload config');
  conf = loadConfig();

  var uid = process.env.UID ? process.env.UID : conf.uid;

  var htmlURL = 'http://xueqiu.com/{uid}'.replace('{uid}', uid);
  var stocksURL = 'http://xueqiu.com/stock/portfolio/stocks.json?size=1000&tuid={uid}'.replace('{uid}', uid);
  var stocksPriceURL = 'http://xueqiu.com/stock/quote.json';

  request(htmlURL, function(err, res) {
    if (!err && res.statusCode === 200) {
      request(stocksURL, function(err, res, body) {
        if (!err && res.statusCode === 200) {
          var stocks = JSON.parse(body).stocks;
          request({
            uri: stocksPriceURL,
            qs: {
              code: _.pluck(stocks, 'code').join(',')
            }
          }, function(err, res, body) {
            if (err) {
              console.log('err', err);
              return;
            }
            var slimStocks = [];
            _.each(stocks, function(stock, idx) {
              var s = JSON.parse(body).quotes[idx];
              stock = _.pick(stock, 'stockName', 'code');
              stock.current = parseFloat(s.current);
              stock.percentage = parseFloat(s.percentage);
              stock.change = parseFloat(s.change);
              slimStocks.push(stock);
            });
            menu.window.webContents.send('got-all', slimStocks);
          });
        }
      });
    } else if (err) {
      console.log(err);
    }
  });
}
