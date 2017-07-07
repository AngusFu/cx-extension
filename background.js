chrome.browserAction.onClicked.addListener(function updateIcon() {
    let r = /^https?:\/\/video\.chaoxing\.com\/(serie|play)_/;

    chrome.tabs.query({active: true}, function (tabs) {
        let tab = tabs.filter(tab => r.test(tab.url))[0];
        let url = (tab && tab.url || '');

        let detailR = /^https?:\/\/video\.chaoxing\.com\/play_(\d+)_(\d+).shtml/;
        let match = url.match(detailR);
        let id;
        if (match) {
            url = `http://video.chaoxing.com/serie_${match[1]}.shtml`;
            id  = match[2];
        }
        chrome.tabs.create({
            url: `./index.html?url=${url}${id ? '&id=' + id : '' }` 
        });tab.url
    });
});
