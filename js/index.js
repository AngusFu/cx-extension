/**
 * Notice: there are accasions where flv can't play
 */

const crawlAndDownload = (listUrl, callback) => {
  let match = listUrl.match(/serie_(\d+)/);
  let serieId = match && match[1];
  let listAPI = `http://video.chaoxing.com/ajax/getvideolistinfo_${serieId}_1.shtml?&pageNo=1&pageSize=9999`;

  fetch(listAPI)
  .then(res => res.json())
  .then((json) => {
    let list = json.datas.map((item, i) => {
      let index = String(i + 1).slice(-2);
      return [`第${index}集：${item.title}`, item.getVideoUrl, item.videoId]
    });
    callback && callback(list);
  });
};

const loadVideoPlayer = (url, elem) => {
  let flvPlayer = flvjs.createPlayer({ type: 'flv', url });
  flvPlayer.attachMediaElement(elem);
  flvPlayer.load();
  flvPlayer.play();
  return flvPlayer;
};

new Vue({
  el: '#app',
  template: `<div class="list-wrap">
  <div class="info">
      <input @change="onSourceChange" placeholder="输入播放列表">
      <p>
        播放速度：
        <span
          v-for="speed in speeds"
          @click="changeRate(speed)"
          :class="{active: speed == curSpeed}"
        >{{speed}}</span>
      <p>
      <p>正在播放：{{curItem[0]}}</p>
  </div>

  <ul>
    <li
      v-for="item in list"
      @click="play(item)"
      :class="{current: item == curItem}"
    >{{item[0]}}</li>
  <ul>
</div>
`,
  data() {
    return {
      list: [],
      curSourceList: '',
      curItem: [''],
      player: null,
      videoEl: null,
      speeds: [1.0, 1.3, 1.5, 2.0],
      curSpeed: 1.0
    };
  },
  methods: {
    play(item, callback) {
      if (this.curItem === item) return;

      let index = this.list.indexOf(item);
      localStorage['lastIndex'] = index;

      fetch(item[1])
      .then(r => r.json())
      .then(json => {
        this.curItem = item;
        this.player && this.player.destroy();
        this.player = loadVideoPlayer(json.videoUrls, this.videoEl);

        // in case of error
        // BUT this won't help
        this.player.on(flvjs.ErrorTypes.MEDIA_ERROR, () => {
          localStorage.clear();
        });

        callback && callback();
      });
    },

    fetchPlay(url, start) {
      localStorage['sourceUrl'] = url;
      crawlAndDownload(url, list => {
        this.list = list;
        if (typeof start === 'function') {
          start(this.list);
        } else {
          this.play(list[start || 0]);
        }
      });
    },

    onSourceChange(e) {
      let url = e.target.value;
      let r = /^https?:\/\/video\.chaoxing\.com\/serie_\d+\.shtml/;

      if (!r.test(url)) {
        url.trim() && alert('url 输入有误');
        return;
      }

      this.fetchPlay(url);
    },

    changeRate(val) {
      this.curSpeed = +val;
      $('video')[0].playbackRate = val;
    }
  },
  mounted() {
    let scrollIntoView = () => {
        this.$nextTick(() => {
          let current = this.$el.querySelector('.current');
          current && current.scrollIntoView();
        });  
    };

    videojs($('#vPlayerCon')[0]);
    this.videoEl = $('video')[0];

    // 绑定事件
    // 自动播放下一段
    $('video').on('ended', () => {
      let list = this.list;
      let len = list.length;
      let curIndex = list.indexOf(this.curItem);
      if (len) {
        if (curIndex + 1 >= len) return;

        let next = list[curIndex + 1];
        this.play(next, scrollIntoView);
      }
    });
    
    let searchParams = (new URL(location.href)).searchParams;
    let fromURL = searchParams.get('url');
    let id = searchParams.get('id') || 0;

    if (fromURL) {
      this.fetchPlay(fromURL, list => {
        let index = list.findIndex(item => item[2] == id);
        index = index > -1 ? index : 0;
        this.play(list[index], scrollIntoView);
      });

      history.replaceState({}, '', './index.html')
    } else {
      let { sourceUrl, lastIndex } = localStorage;
      if (sourceUrl) {
        let index = lastIndex || 0;
        this.fetchPlay(sourceUrl, list => {
          this.play(list[index], scrollIntoView);
        });
      }
    }
  },
  destroy() {
    $('video').off();
    this.player && this.player.destroy();
  }
});
