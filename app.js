// var _   = require('lodash');
var electron = require('electron');
// var fs  = require('fs');
var Vue = require('vue');
var ipc = electron.ipcRenderer;

Vue.component('stock-grid', {
  template: '#stock-grid-template',
  replace: true,
  data: function () {
    return {
      columns: null,
      sortKey: '',
      reversed: {}
    };
  },
  compiled: function () {
    var self = this;
    this.columns.forEach(function (column) {
      self.reversed.$add(column.key, false);
    });
  },
  methods: {
    sortBy: function (key) {
      this.sortKey = key;
      this.reversed[key] = !this.reversed[key];
    }
  }
});

var stock = new Vue({
  el: '#container',
  data: {
    gridColumns: [
    {
      key: 'code',
      displayName: '股票'
    },
    {
      key: 'current',
      displayName: '当前价'
    },
    {
      key: 'percentage',
      displayName: '涨跌幅'
    }],
    gridData: []
  },
  methods: {
    onOpenDir: function () {
      ipc.send('open-dir');
    },
    onTerminate: function () {
      ipc.send('terminate');
    }
  }
});

ipc.on('got-all', function gotAll(e, data) {
  console.log(data);
  stock.gridData = data;
});
