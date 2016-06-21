# AGL Server - Геокодер
===========

Необходимые модули для Api:
-------

``# npm install MD5``<br>
``# npm install kladrapi``<br>
``# npm install node-fetch``<br>
``# npm install mongoose``<br>
``# npm install redis``

2. Необходимые модули для Agl Server:

``# npm install cluster``
``# npm install minimist``
``# npm install net``

3. Необходимые модули для Agl agent WS Server:

``# npm install net``
``# npm install http``
``# npm install websocket``
``# npm install minimist``


Параметры запуска для Agl Server:

``# ./agl.js --redis=127.0.0.1:6379 --mongo=127.0.0.1:27017 —fork=127.0.0.1:4420 —rpass=password —rdb=12``

или

``# ./agl.js -r 127.0.0.1:6379 -m 127.0.0.1:27017 -f 127.0.0.1:4420 -p password -b 12``

Параметры запуска для Agl agent WS Server:

``# ./ws.js --redis=127.0.0.1:6379 --server=127.0.0.1:3320 —fork=127.0.0.1:4420 —rpass=password —rdb=12``

или

``# ./ws.js -r 127.0.0.1:6379 -s 127.0.0.1:3320 -f 127.0.0.1:4420 -p password -b 12``

<p style="color:red;">Данные параметры за исключением Password Redis и DataBase Redis прописаны по умолчанию и вводить их нет необходимости, параметры запуска указываются только если они отличаются от текущих.</p>

