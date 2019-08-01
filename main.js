require('electron-debug')({showDevTools: true});

const electron = require('electron');
const { menubar } = require('menubar');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const request = require('request').defaults({jar: true});
const ipc = electron.ipcMain;
const shell = electron.shell;

const menu = menubar({
  dir: __dirname,
  preloadWindow: true,
  icon: path.join(__dirname, 'images', 'Icon.png'),
  browserWindow: {
    width: 350,
    height: 370,
    webPreferences: {
      nodeIntegration: true
    }
  }
});

let conf = loadConfig();

menu.on('ready', function ready() {

  ipc.on('terminate', function terminate() {
    menu.app.quit();
  });

  ipc.on('open-dir', function openDir() {
    shell.showItemInFolder(path.join(conf.exec.cwd, 'config.json'));
  });

  var refreshTimer = null;
  menu.on('show', function() {
    console.log('register refresh timer');
    getStocks(function () {
      refreshTimer = setInterval(function () {
        getStocks(function () {
          refreshTimer = null;
        });
      }, 5 * 1e3);
    })
  });

  menu.on('hide', function() {
    console.log('clear refresh timer');
    if (!refreshTimer) {
      return;
    }
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

function getStocks(callback) {
  conf = loadConfig();

  var uid = process.env.UID ? process.env.UID : conf.uid;

  var htmlURL = 'http://xueqiu.com/{uid}'.replace('{uid}', uid);
  var stocksURL = 'http://xueqiu.com/stock/portfolio/stocks.json?size=1000&tuid={uid}'.replace('{uid}', uid);
  var stocksPriceURL = 'http://xueqiu.com/stock/quote.json';

  request(htmlURL, function(err, res) {
    if (!err && res.statusCode === 200) {
      request(stocksURL, function(err, res, body) {
        if (!err && res.statusCode === 200) {
          var parsedData = null;
          try {
            parsedData = JSON.parse(body);
          } catch (e) {
            return;
          }
          var stocks = parsedData.stocks;
          var stocksQs = '';

          if (conf.portfolio) {
            // 如果只显示某个自选组合
            var choosedPortfolio = _.find(parsedData.portfolios, function (o) {
              return o.name === conf.portfolio;
            });

            if (choosedPortfolio) {
              // has one
              stocksQs = choosedPortfolio.stocks;
            }
          }

          if (!stocksQs) {
            stocksQs = _.map(stocks, 'code').join(',');
          }

          request({
            uri: stocksPriceURL,
            qs: {
              code: stocksQs
            }
          }, function(err, res, body) {
            if (err) {
              console.log('err', err);
              return;
            }
            var slimStocks = [];
            var quotesJson = [];

            try {
              quotesJson = JSON.parse(body).quotes || [];
            } catch (e) {
              quotesJson = [];
            }

            _.each(quotesJson, function(stock) {
              stock = _.pick(stock, 'name', 'code', 'current', 'percentage', 'change');
              stock.current = parseFloat(stock.current);
              stock.currentFormated = parseFloat(Math.round(stock.current * 100) / 100).toFixed(2);
              stock.percentage = parseFloat(stock.percentage);
              stock.change = parseFloat(stock.change);
              slimStocks.push(stock);
            });

            menu.window.webContents.send('got-all', slimStocks);

            // call callback
            if (callback) {
              callback();
            }
          });
        }
      });
    } else if (err) {
      console.log(err);
    }
  });
}
