var CACHE_NAME = 'my-cache';
var urlsToCache = [
    'index.html',
    'main.js',
    'sw.js'
];

self.addEventListener('install', function(event){
    self.skipWaiting(); //if we want to activate sw immediately (see event.waitUntil(clients.claim()) in activate step)
    event.waitUntil(
        //Open and init cache
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        //First network
        fetch(event.request).catch(function() {
            //Network failed - check cache
            return caches.match(event.request).then(function(response) {
                if (response) { //there is response in cache
                    return response;
                }
                //There's no response in cache - return default info
                return caches.match('some information page');
            }).catch(function() {
                //There's no response in cache - return default info
                return caches.match('some information page');
            });
        })
    );
});

self.addEventListener('activate', function(event){
    var cacheWhitelist = ['pages-cache-v1', 'blog-posts-cache-v1'];
    event.waitUntil(clients.claim()); //if we want to activate sw immediately (see self.skipWaiting() in install step)
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        //clear only cache my-cache
                        //return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('message', function(event){
    send_message_to_client(event.ports[0], "OK, noted!"); //send message to particular client
    send_message_to_all_clients("OK, noted!"); //send message to all clients
});


function send_message_to_client(client, msg){
    return new Promise(function(resolve, reject){
        var msg_chan = new MessageChannel();
        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };
        client.postMessage(msg, [msg_chan.port2]);
    });
}


function send_message_to_all_clients(msg){
    clients.matchAll().then(clients => {
        clients.forEach(client => {
            send_message_to_client(client, msg).then(m => console.log("SW Received Message: "+m));
        })
    })
}