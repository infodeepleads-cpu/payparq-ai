'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {".vercel/project.json": "f24d53175af132d72f98a5f5b8ced698",
".vercel/README.txt": "2b13c79d37d6ed82a3255b83b6815034",
"app-release.apk": "b3a78b01838769ea5cda50497a972755",
"assets/AssetManifest.bin": "8fa3788591a0fd1ec1027b6bea131aec",
"assets/AssetManifest.bin.json": "5ca8fc3875dfe0ffc877756d9df027ee",
"assets/assets/images/sign_template_v2.png": "fbed4113acdc0c032504ee3ad51d9d81",
"assets/assets/images/whatsapp.jpg": "53af70614dea96cf7bc99d6b69327297",
"assets/assets/images/your_photo.png": "fbed4113acdc0c032504ee3ad51d9d81",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"assets/fonts/MaterialIcons-Regular.otf": "e7069dfd19b331be16bed984668fe080",
"assets/NOTICES": "483e0fd0dc877aa263fef8c8c2e41246",
"assets/packages/flutter_map/lib/assets/flutter_map_logo.png": "208d63cc917af9713fc9572bd5c09362",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/shaders/stretch_effect.frag": "40d68efbbf360632f614c731219e95f0",
"canvaskit/canvaskit.js": "8331fe38e66b3a898c4f37648aaf7ee2",
"canvaskit/canvaskit.js.symbols": "a3c9f77715b642d0437d9c275caba91e",
"canvaskit/canvaskit.wasm": "9b6a7830bf26959b200594729d73538e",
"canvaskit/chromium/canvaskit.js": "a80c765aaa8af8645c9fb1aae53f9abf",
"canvaskit/chromium/canvaskit.js.symbols": "e2d09f0e434bc118bf67dae526737d07",
"canvaskit/chromium/canvaskit.wasm": "a726e3f75a84fcdf495a15817c63a35d",
"canvaskit/skwasm.js": "8060d46e9a4901ca9991edd3a26be4f0",
"canvaskit/skwasm.js.symbols": "3a4aadf4e8141f284bd524976b1d6bdc",
"canvaskit/skwasm.wasm": "7e5f3afdd3b0747a1fd4517cea239898",
"canvaskit/skwasm_heavy.js": "740d43a6b8240ef9e23eed8c48840da4",
"canvaskit/skwasm_heavy.js.symbols": "0755b4fb399918388d71b59ad390b055",
"canvaskit/skwasm_heavy.wasm": "b0be7910760d205ea4e011458df6ee01",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"flutter.js": "24bc71911b75b5f8135c949e27a2984e",
"flutter_bootstrap.js": "e976951589f9c1750c55cb5fb0534f38",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "c33860ce431424747ec8c0cf05afb283",
"/": "c33860ce431424747ec8c0cf05afb283",
"main.dart.js": "92c341083f0f809505e2f83b645c3a45",
"main.dart.js_1.part.js": "5a7796e8f3734a76d14f3356f62fe108",
"main.dart.js_10.part.js": "30d21efaedfa2c9c654f1a7de3515ecb",
"main.dart.js_100.part.js": "70f444c6320e88c84aa0872961575648",
"main.dart.js_101.part.js": "b88315afb2fd2ddeec464690389affbe",
"main.dart.js_102.part.js": "3edeaba3d983ecfd746db5fe76bbb0c5",
"main.dart.js_103.part.js": "0dbe61fefafca5f4ee5041c9cbb14e06",
"main.dart.js_104.part.js": "136c05c1e4b7f85772edaa3f21e2a362",
"main.dart.js_105.part.js": "a3646186f1fce51d372d6e6c61400f6c",
"main.dart.js_106.part.js": "5dc5ea86652aa0bb3a4299bbce052bba",
"main.dart.js_107.part.js": "d4793d388f44ec2736f0a16f882af4af",
"main.dart.js_108.part.js": "0a49b843187d596e1d8716072e22ea31",
"main.dart.js_109.part.js": "980f4ba2fe2317aaed08f6504cb23be3",
"main.dart.js_11.part.js": "3e83261c3b12c5ecdf868d29b65ad47f",
"main.dart.js_110.part.js": "360b0a1351e6bb1c26bd4baded65c1e5",
"main.dart.js_111.part.js": "a04539da1a97d0e0340a3be2f2912bd3",
"main.dart.js_112.part.js": "91e65c1006cc7bd93a0f8fe526280c36",
"main.dart.js_113.part.js": "cf07242b1a8b4f4a35f1578fe5baad78",
"main.dart.js_114.part.js": "fff35807bc3f3df03a63a1a3989ef379",
"main.dart.js_115.part.js": "2849cfbc6cc1d5e3ea93442205aa086c",
"main.dart.js_116.part.js": "5a51649a860e4561b4e0af3757941b52",
"main.dart.js_117.part.js": "f0f1d1de496bdb2654eaf1c32347ff60",
"main.dart.js_118.part.js": "3a3d5809a74b76d9f7e4b8f55598b420",
"main.dart.js_119.part.js": "3a9ca46fd9eb288095e08fed9636d09b",
"main.dart.js_12.part.js": "dfbe01bebc63a0283aa1c5cbf7f1de11",
"main.dart.js_120.part.js": "a23a1621f3f31fa04dde5b31be55b55f",
"main.dart.js_121.part.js": "ac2625472b6a0d5a79b44a489b8c4a39",
"main.dart.js_13.part.js": "9131785867a6bff573220c1e16ae031f",
"main.dart.js_14.part.js": "41fc5677caecfe03d5e549762eeaece6",
"main.dart.js_15.part.js": "056605799b5673f63da077f9dcf32a05",
"main.dart.js_16.part.js": "375932842409fa99124c4accc2d5f64d",
"main.dart.js_17.part.js": "56cd84b90ef11075f036690a594329e1",
"main.dart.js_18.part.js": "05b20939db11319b863a2d3716d47a93",
"main.dart.js_19.part.js": "71630d0ac9fd0b31c0b98339bfa019cf",
"main.dart.js_2.part.js": "bf295f4498019ad548f241844853805f",
"main.dart.js_20.part.js": "279dd21fdf773659fc89480d75d9f91c",
"main.dart.js_21.part.js": "49e40c30700c015b71d0ad3a8c553ec0",
"main.dart.js_22.part.js": "bb3df8458a62cbed3aeaccc99d4b4523",
"main.dart.js_23.part.js": "7b40ed3ae03480c69381e5effcafe088",
"main.dart.js_24.part.js": "c34bb1f10d612b09859a4702e63145df",
"main.dart.js_25.part.js": "ad873a6a16b7735228b4d79c006fceef",
"main.dart.js_26.part.js": "ec2dbde837874db9bba5858a3466deac",
"main.dart.js_27.part.js": "ef31e5d7283409fbd0c8431ce9bf2edb",
"main.dart.js_28.part.js": "b0caaff90e4637e1cc50c280ffc71274",
"main.dart.js_29.part.js": "11dbc7db677df5a35f8865195531c0ae",
"main.dart.js_3.part.js": "e1ec7f4442cb0d1edfee81da76001721",
"main.dart.js_31.part.js": "b77cc56b43d1f626fe36df06e9c14cf4",
"main.dart.js_34.part.js": "f1ab384b28c33227b160a8a8fdc1a115",
"main.dart.js_36.part.js": "f76df56e293427fbd473e2bab2535bc1",
"main.dart.js_37.part.js": "4c93c1020e78595079b0fb354a7fdc0b",
"main.dart.js_38.part.js": "1b0c66ebb4c41598170471cc4cf12528",
"main.dart.js_4.part.js": "b417d7664076650fa2f29f31be6e8255",
"main.dart.js_43.part.js": "b05fcaef185f57791dde6a7f3efbfa14",
"main.dart.js_44.part.js": "b05d8aed0686dff506b38956cc60cfa3",
"main.dart.js_49.part.js": "7e4c04bd866067531ed3f449d452080d",
"main.dart.js_5.part.js": "4df9f15134058869c4151ff7a6489a78",
"main.dart.js_50.part.js": "e70c493c9a5e81c1aa45d87444481a93",
"main.dart.js_52.part.js": "494dde0b2113dcbeb945e738b4de5636",
"main.dart.js_53.part.js": "b689ce7487cc2c4ad37329b08699a569",
"main.dart.js_54.part.js": "513033477a86f08f156da4d50249565b",
"main.dart.js_55.part.js": "34ce5d979a0429adb6c299f7b4183181",
"main.dart.js_56.part.js": "8872c01755811736b23d292624291a4b",
"main.dart.js_57.part.js": "116d9b43b53ff9067dc46362c35b89e8",
"main.dart.js_58.part.js": "3f89c5d3d076cf83ffc87aa11fff5fe8",
"main.dart.js_59.part.js": "55cb806d832ffa8ab8acb710736bfbff",
"main.dart.js_6.part.js": "de5491c5a5948c6bbc0f2ed0c8f537bd",
"main.dart.js_61.part.js": "f7769514682403e84c1b21ba3ffb158d",
"main.dart.js_62.part.js": "c6a8464293b101c65fc673484e61b63e",
"main.dart.js_63.part.js": "2c38a6129668ba64bdfec8f3719dcd17",
"main.dart.js_64.part.js": "44b12ca879227a876953035ee968cc88",
"main.dart.js_65.part.js": "dad9e0d5c6fc8cdcf4901b240867cb69",
"main.dart.js_66.part.js": "3434ccc95c6b1527f0896e0d3b62313e",
"main.dart.js_70.part.js": "9b6135f2e76ab8e8992aae738d5bdeed",
"main.dart.js_71.part.js": "5f65189a852dfb5370378059332718b9",
"main.dart.js_72.part.js": "2f8fa333aca948a1e48b713a035fc730",
"main.dart.js_73.part.js": "8778f73973f3b2aa9d0e3c1d2f22c295",
"main.dart.js_74.part.js": "f6fcd1e47ddf99cb3067368de2a7f80d",
"main.dart.js_8.part.js": "9893ba2c17eefac7eae9271371eaae08",
"main.dart.js_80.part.js": "41f4cb3d74236f0f94348cd0da047724",
"main.dart.js_81.part.js": "2a790099959df07f4fba6ef916a4665d",
"main.dart.js_82.part.js": "0ff4436109e7056a06568cc14a87b80c",
"main.dart.js_83.part.js": "8c7e3196396f4a36afb4c75cbd38a59b",
"main.dart.js_84.part.js": "3bf4f7f8ba3af6baaf8310ac85a36864",
"main.dart.js_85.part.js": "5a7a7b393d9074aa45d42720f62077c4",
"main.dart.js_87.part.js": "7f310a6a47c063e90e258f934af628c4",
"main.dart.js_88.part.js": "5f2b0e476748e33286e39081d4a93a1c",
"main.dart.js_89.part.js": "79b54261c9926892674c77263b9ce30c",
"main.dart.js_9.part.js": "6c194faa0af04d16ae1088a3a790a82c",
"main.dart.js_90.part.js": "e7bc6262f23c48c3aa75e90b5f8acf2e",
"main.dart.js_91.part.js": "ca90638c61e99dac91a8c2a118a47896",
"main.dart.js_92.part.js": "59bef3d1d1e68c041104b7e9453db51c",
"main.dart.js_93.part.js": "c287fad045fd3edea6a4318cb6dfb5c8",
"main.dart.js_94.part.js": "b979c6b3610cc297bbbfb5590e7de8cc",
"main.dart.js_95.part.js": "0f87cfb93d38992dba7fe5eff91ab7c2",
"main.dart.js_96.part.js": "4e226716342f036439d54da0476d6749",
"main.dart.js_97.part.js": "c396fb7edda8f6c79e7570d0a21468b1",
"main.dart.js_98.part.js": "600f042dff3e9cc0fed6ea94fd6a60f5",
"main.dart.js_99.part.js": "8f65c99044725aef95986f29e0b11204",
"manifest.json": "e0ff114fd2c8259cc45322d25ac23928",
"vercel.json": "94605833f1097b4b5ba919b7f8ba9499",
"version.json": "b51e81d5768f5aa720fcdabc02d15478"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
