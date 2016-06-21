# AGL Server - Геокодер

В качестве основных источников данных служит база данных <strong>Кладр</strong>

Необходимые модули для Api:
-------
```
# npm install MD5
# npm install kladrapi
# npm install node-fetch
# npm install mongoose
# npm install redis
```

Необходимые модули для Agl Server:
-------

``# npm install cluster``<br>
``# npm install minimist``<br>
``# npm install net``<br>

Необходимые модули для Agl agent WS Server:
-------

``# npm install net``<br>
``# npm install http``<br>
``# npm install websocket``<br>
``# npm install minimist``<br>

Параметры запуска для Agl Server:
-------

``# ./agl.js --redis=127.0.0.1:6379 --mongo=127.0.0.1:27017 —fork=127.0.0.1:4420 —rpass=password —rdb=12``<br>

или

``# ./agl.js -r 127.0.0.1:6379 -m 127.0.0.1:27017 -f 127.0.0.1:4420 -p password -b 12``<br>

Параметры запуска для Agl agent WS Server:
-------

``# ./ws.js --redis=127.0.0.1:6379 --server=127.0.0.1:3320 —fork=127.0.0.1:4420 —rpass=password —rdb=12``<br>

или

``# ./ws.js -r 127.0.0.1:6379 -s 127.0.0.1:3320 -f 127.0.0.1:4420 -p password -b 12``<br>

<p style="color:red;">Данные параметры за исключением Password Redis и DataBase Redis прописаны по умолчанию и вводить их нет необходимости, параметры запуска указываются только если они отличаются от текущих.</p>

