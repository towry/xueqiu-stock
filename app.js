// var _   = require('lodash');
var electron = require('electron');
// var fs  = require('fs');
var Vue = require('vue/dist/vue');
var ipc = electron.ipcRenderer;

Vue.component('stock-grid', {
  template: '#stock-grid-template',
  // replace: true,

  data: function () {
    return {
      sortKey: '',
      reversed: {}
    };
  },

  props: {
    columns: {
      type: Array,
      default: (() => []),
    },
    data: {
      type: Array,
      default: (() => []),
    }
  },

  created() {
    this.columns.forEach((column) => {
      this.reversed[column.key] = false;
    })
  },

  methods: {
    sortBy(key) {
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
      displayName: 'Ticker'
    },
    {
      key: 'current',
      displayName: 'Current'
    },
    {
      key: 'percentage',
      displayName: 'Change'
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
