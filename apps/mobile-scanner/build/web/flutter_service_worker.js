'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {".vercel/project.json": "f24d53175af132d72f98a5f5b8ced698",
".vercel/README.txt": "46033a54ce06911bdbe84643b2d83eb1",
"app-release.apk": "b3a78b01838769ea5cda50497a972755",
"assets/AssetManifest.bin": "8fa3788591a0fd1ec1027b6bea131aec",
"assets/AssetManifest.bin.json": "5ca8fc3875dfe0ffc877756d9df027ee",
"assets/assets/images/sign_template_v2.png": "fbed4113acdc0c032504ee3ad51d9d81",
"assets/assets/images/whatsapp.jpg": "53af70614dea96cf7bc99d6b69327297",
"assets/assets/images/your_photo.png": "fbed4113acdc0c032504ee3ad51d9d81",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"assets/fonts/MaterialIcons-Regular.otf": "e7069dfd19b331be16bed984668fe080",
"assets/NOTICES": "21affe0280e32fd8f71c64163fb771bb",
"assets/packages/flutter_map/lib/assets/flutter_map_logo.png": "208d63cc917af9713fc9572bd5c09362",
"assets/shaders/ink_sparkle.frag": "9bb2aaa0f9a9213b623947fa682efa76",
"assets/shaders/stretch_effect.frag": "a70217f9ceba606e287441a0df5be64d",
"canvaskit/canvaskit.js": "4d1e85fa7485c3b2f38877206ad60089",
"canvaskit/canvaskit.js.symbols": "cd60996d998c96148c6b3245aa4f79be",
"canvaskit/canvaskit.wasm": "9b6a7830bf26959b200594729d73538e",
"canvaskit/chromium/canvaskit.js": "5986f8281d3ff5aa43516ec637c2352b",
"canvaskit/chromium/canvaskit.js.symbols": "abce3e84295438db81e9753c30fe3c2b",
"canvaskit/chromium/canvaskit.wasm": "a726e3f75a84fcdf495a15817c63a35d",
"canvaskit/skwasm.js": "d16458b3d26fe6c8c52bf62df5e5a52f",
"canvaskit/skwasm.js.symbols": "148546317b68494b4e09dcab02f87135",
"canvaskit/skwasm.wasm": "7e5f3afdd3b0747a1fd4517cea239898",
"canvaskit/skwasm_heavy.js": "d684311c36a7a439e12bebd0b63a9bea",
"canvaskit/skwasm_heavy.js.symbols": "218aadf9004b320bc6cf0d0bb04ed157",
"canvaskit/skwasm_heavy.wasm": "b0be7910760d205ea4e011458df6ee01",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"flutter.js": "1c7e59be1cc906f8d37361ad32ed7e52",
"flutter_bootstrap.js": "8d172853376d4cb2620eb018e31953d0",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"index.html": "e22f0dcae833504c43c4c1a79c7b372f",
"/": "e22f0dcae833504c43c4c1a79c7b372f",
"main.dart.js": "17bbed220e02adfcc5f60e15a1fdd1db",
"main.dart.js_1.part.js": "122210db30cb328760aa2ddfa586de75",
"main.dart.js_10.part.js": "29602baa336c8099cf7664117f063974",
"main.dart.js_100.part.js": "156f0f1bdf5a8914a45dc79c2377140e",
"main.dart.js_101.part.js": "92201b13b03da99afef5ecc04a036e4f",
"main.dart.js_102.part.js": "3edeaba3d983ecfd746db5fe76bbb0c5",
"main.dart.js_103.part.js": "9cbc5135dafcd843fec5105b422e4eb6",
"main.dart.js_104.part.js": "75c49471a9d56a14306fcc2c07a564b7",
"main.dart.js_105.part.js": "bef4b95a960625c9af5110d487e6b42d",
"main.dart.js_106.part.js": "384761fe3b2e4e1b90c287eed36d0b81",
"main.dart.js_107.part.js": "8886efe706cb8aaf86037f4f0e66cc75",
"main.dart.js_108.part.js": "f3bfa0832ff6fedc7de06ae7120ee15e",
"main.dart.js_109.part.js": "ac29504fbdbb9ff8127c6ddfd94d1e51",
"main.dart.js_11.part.js": "bb5c9e0e881b30f0e24c9b1a0a61e318",
"main.dart.js_110.part.js": "7e90cc71ebcdbb77d6691839d11ebbd1",
"main.dart.js_111.part.js": "9ebb0e486ae3b617da99f4f28f63f880",
"main.dart.js_112.part.js": "91e65c1006cc7bd93a0f8fe526280c36",
"main.dart.js_113.part.js": "485e1125c669513b48d8dd82cea7f9fc",
"main.dart.js_114.part.js": "e2dbf9e1441836b494ffb5033d55d73a",
"main.dart.js_115.part.js": "c08f108e8a0d01bb6acbd9f94ec7b33d",
"main.dart.js_116.part.js": "0986f0f858812393a7ea960b8500055b",
"main.dart.js_117.part.js": "35af0b717d91664012287e268236d1f9",
"main.dart.js_118.part.js": "83da5ced382a7e054933b297ef034ac2",
"main.dart.js_119.part.js": "3a9ca46fd9eb288095e08fed9636d09b",
"main.dart.js_12.part.js": "852bb7ba1fdc9fa39adc3bc47eeaff5a",
"main.dart.js_120.part.js": "a23a1621f3f31fa04dde5b31be55b55f",
"main.dart.js_121.part.js": "ac2625472b6a0d5a79b44a489b8c4a39",
"main.dart.js_13.part.js": "e063fcaedf6a6c4f818bc61821277642",
"main.dart.js_14.part.js": "d352b0ee2bce3aedd09984bfe3177e63",
"main.dart.js_15.part.js": "056605799b5673f63da077f9dcf32a05",
"main.dart.js_16.part.js": "375932842409fa99124c4accc2d5f64d",
"main.dart.js_17.part.js": "8fec67a188ac9ba2318ec3f90d8b07bf",
"main.dart.js_18.part.js": "81ae8b28421ef95ca209c0f6f13ea523",
"main.dart.js_19.part.js": "a8a06c2bedc6390549f22d58350de0d4",
"main.dart.js_2.part.js": "3d2b3be2b648da20fb835c19ed77a9d8",
"main.dart.js_20.part.js": "279dd21fdf773659fc89480d75d9f91c",
"main.dart.js_21.part.js": "4a44594edbb53724174d0820c356d508",
"main.dart.js_22.part.js": "bb3df8458a62cbed3aeaccc99d4b4523",
"main.dart.js_23.part.js": "8bd891a2c6d32217976b0a361f20af8c",
"main.dart.js_24.part.js": "a51dc62301e717cf74d48c55cc3863f8",
"main.dart.js_25.part.js": "c4363dcdbf90e84e8b4ecff72bb7bc78",
"main.dart.js_26.part.js": "68cf0839a3bdd39d3959133f75df8718",
"main.dart.js_27.part.js": "168b5d959c5295ce87026ad361f13685",
"main.dart.js_28.part.js": "9a64c3f3f38db2e276c74921b57970b0",
"main.dart.js_29.part.js": "cb9e47907a2f0c47093b64ecefcfa072",
"main.dart.js_3.part.js": "46aa9fb51bc736309636a4f7b19d43be",
"main.dart.js_31.part.js": "1f5ec526ff256f9a41b4da6884b6e824",
"main.dart.js_34.part.js": "2564d8c623f72dfa2da51655ba3a884c",
"main.dart.js_36.part.js": "80842efb112b0ecaf378a830e585c266",
"main.dart.js_37.part.js": "07f0855d1c1a1f9e68ce5551d3b99ca8",
"main.dart.js_38.part.js": "ef831cbea3b338123abafb81054499cb",
"main.dart.js_4.part.js": "4241e12b7fa9c4487dbffc315efd11ec",
"main.dart.js_43.part.js": "b05fcaef185f57791dde6a7f3efbfa14",
"main.dart.js_44.part.js": "601827474294b3620b147d50ffcba0ca",
"main.dart.js_49.part.js": "06cb675ac18a4c856275b3f14a6cd869",
"main.dart.js_5.part.js": "22d12a8abcf773ea2f76debd8ead84f5",
"main.dart.js_50.part.js": "e70c493c9a5e81c1aa45d87444481a93",
"main.dart.js_52.part.js": "51279b2e6a70696e339d691bc76a28de",
"main.dart.js_53.part.js": "b689ce7487cc2c4ad37329b08699a569",
"main.dart.js_54.part.js": "7a1369a13ce79ec83e2d857084446205",
"main.dart.js_55.part.js": "0fbd87e39d3f98a15bb0740793f5df98",
"main.dart.js_56.part.js": "a57f20df4d9eb95cc8f1c49064f80480",
"main.dart.js_57.part.js": "091dcf5ba74dc207b511ddd07f66f933",
"main.dart.js_58.part.js": "042841b18f29236df034e4c661e09adb",
"main.dart.js_59.part.js": "55cb806d832ffa8ab8acb710736bfbff",
"main.dart.js_6.part.js": "4ca735f422738bb599add7dcc4c48904",
"main.dart.js_61.part.js": "962d5eb93dfc8b13ccb4b3e947c2420b",
"main.dart.js_62.part.js": "efc2554e438adb27577afd8c5b0ea725",
"main.dart.js_63.part.js": "e17214d62fb4bae373e86b0fc09e98a8",
"main.dart.js_64.part.js": "9d3ad63492aa70df0359eafe96f2f405",
"main.dart.js_65.part.js": "e8db4d40852b068db5ce6ec1ac1d3db2",
"main.dart.js_66.part.js": "3434ccc95c6b1527f0896e0d3b62313e",
"main.dart.js_70.part.js": "f01c8401c1f9cee009eeee346c60c8f8",
"main.dart.js_71.part.js": "f0e3cb2d81fd604bde05dfe501704865",
"main.dart.js_72.part.js": "5fcdf872e69f774a6bb27459a9e84c10",
"main.dart.js_73.part.js": "18af9cf2ad21fdbb1051486bc0fb6b1e",
"main.dart.js_74.part.js": "c93d7beeec149935b3fafeea22d1ad6a",
"main.dart.js_8.part.js": "fc638b42d842b929e18ba43c96915422",
"main.dart.js_80.part.js": "1f700743c644b26675a3224f8ab58304",
"main.dart.js_81.part.js": "0890fedc65fac4fe9fdb52d8b6d503b1",
"main.dart.js_82.part.js": "ce879c83501b18a07eee75223154c7bc",
"main.dart.js_83.part.js": "93a7b7be0f72e0de5e9c022eb1ba6b5d",
"main.dart.js_84.part.js": "323a137dc783e10ee9c63b8cf3586797",
"main.dart.js_85.part.js": "5a7a7b393d9074aa45d42720f62077c4",
"main.dart.js_87.part.js": "c7721edf27216313330825db0ef8e471",
"main.dart.js_88.part.js": "eda2a2e2cdd00b47636994729dad8b9d",
"main.dart.js_89.part.js": "f631685cacbb5b4a09fdf421a6ef5f30",
"main.dart.js_9.part.js": "3f66c6ca9398ed2cbcd816ab51cbaf79",
"main.dart.js_90.part.js": "a8739fa781f53ff28199d87c6f420f14",
"main.dart.js_91.part.js": "c074af37cfd33e95348193d6d32a0d87",
"main.dart.js_92.part.js": "59bef3d1d1e68c041104b7e9453db51c",
"main.dart.js_93.part.js": "aa6c23d40965a56f7e561941297fd7cb",
"main.dart.js_94.part.js": "700e45b006a850c9e1f8887eec296495",
"main.dart.js_95.part.js": "0f87cfb93d38992dba7fe5eff91ab7c2",
"main.dart.js_96.part.js": "580fa38f6e6b8922f7588b90dbd9eb2f",
"main.dart.js_97.part.js": "1689cfdba103040f8c2e6a574b97a45d",
"main.dart.js_98.part.js": "344404706b5f89b71357c76cd25c119e",
"main.dart.js_99.part.js": "c3634e0da612f30d0e40999800c06abf",
"manifest.json": "e0ff114fd2c8259cc45322d25ac23928",
"vercel.json": "3e077a883201889b1a9624d0eb3a540e",
"version.json": "462e904ce6d1a858234c28c1ae2ffc87"};
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
