# AGL Server - Геокодер

В качестве основных источников данных служит база данных **Кладр**

### Необходимые модули для Api:

```
# npm install MD5
# npm install kladrapi
# npm install node-fetch
# npm install mongoose
# npm install redis
```

### Необходимые модули для Agl Server:

```
# npm install cluster
# npm install minimist
# npm install net
```

### Необходимые модули для Agl agent WS Server:

```
# npm install net
# npm install http
# npm install websocket
# npm install minimist
```

### Параметры запуска для Agl Server:

``# ./agl.js --redis=127.0.0.1:6379 --mongo=127.0.0.1:27017 —fork=127.0.0.1:4420 —rpass=password —rdb=12``<br>

или

``# ./agl.js -r 127.0.0.1:6379 -m 127.0.0.1:27017 -f 127.0.0.1:4420 -p password -b 12``<br>

### Параметры запуска для Agl agent WS Server:

``# ./ws.js --redis=127.0.0.1:6379 --server=127.0.0.1:3320 —fork=127.0.0.1:4420 —rpass=password —rdb=12``<br>

или

``# ./ws.js -r 127.0.0.1:6379 -s 127.0.0.1:3320 -f 127.0.0.1:4420 -p password -b 12``<br>

> Данные параметры за исключением Password Redis и DataBase Redis прописаны по умолчанию и вводить их нет необходимости, параметры запуска указываются только если они отличаются от текущих.

## Описание экшенов API

**parseAddress** - Преобразование строкового вида адреса в объект (субъекты адреса должны быть разделены запятой и иметь обозначение типа субъекта)

### Параметры запроса:

```
<b>address</b> - Адрес для интерпретации данных (субъекты должны быть разделены запятыми) *
```

#### запрос:

```
<b>address</b> = страна Российская Федерация, Ивановская область, Южский район, город Южа, улица Смирнова, дом 6, квартира 51
```

#### ответ:

```js
{
	country: {
		name: 'Российская федерация',
		type: 'Страна'
	},
	region: {
		name: 'Ивановская',
		type: 'Область'
	},
	district: {
		name: 'Южский',
		type: 'Район'
	},
	city: {
		name: 'Южа',
		type: 'Город'
	},
	street: {
		name: 'Смирнова',
		type: 'Улица'
	},
	house: {
		name: '6',
		type: 'Дом'
	},
	apartment: {
		name: '51',
		type: 'Квартира'
	},
	address: '{country}, {region}, {district}, {city}, {street}, {house}, {apartment}',
	fullAddress: 'Российская федерация страна, Ивановская область, Южский район, Южа город, Смирнова улица, 6 дом, 51 квартира',
	lightAddress: 'Российская федерация, Ивановская, Южа, Смирнова, 6, 51'
}
```

> если в качестве параметра передать строку без разделителей запятых и явных обозначений субъекта то система будет считать что это страна и обернет объект в параметр subject

---

**getAddress** - Извлечение данных адреса из строки

#### Параметры запроса:

```
address - Адрес для интерпретации данных (разделение запятыми субъектов не обязательно) *
```

#### запрос:

```
address = Россия Ивановская область г.Иваново пр-т.Строителей
```

#### ответ:

```js
{
	country: {
		name: 'Россия',
		type: 'Страна',
		typeShort: 'ст-а',
		contentType: 'country',
		nameFull: 'Российская Федерация',
		nameShort: 'РФ',
		id: '7',
		code: 'ru',
		lat: 61.52401,
		lng: 105.318756,
		gps: [105.318756, 61.52401],
		timezone: {
			dstOffset: 0,
			rawOffset: 25200,
			timeZoneId: 'Asia/Krasnoyarsk',
			timeZoneName: 'Красноярск, стандартное время'
		}
	},
	region: {
		name: 'Ивановская',
		zip: null,
		type: 'Область',
		typeShort: 'обл',
		okato: '24000000000',
		contentType: 'region',
		id: '3700000000000',
		code: 'ru',
		lat: 57.1056854,
		lng: 41.4830084,
		gps: [41.4830084, 57.1056854],
		timezone: {
			dstOffset: 0,
			rawOffset: 10800,
			timeZoneId: 'Europe/Moscow',
			timeZoneName: 'Москва, стандартное время'
		}
	},
	district: false,
	city: {
		timezone: {
			timeZoneName: 'Москва, стандартное время',
			timeZoneId: 'Europe/Moscow',
			rawOffset: 10800,
			dstOffset: 0
		},
		id: '3700000100000',
		name: 'Иваново',
		zip: 153015,
		type: 'Город',
		typeShort: 'г',
		okato: '24401000000',
		contentType: 'city',
		code: 'ru',
		lat: '56.9984452',
		lng: '40.9737394',
		regionId: '3700000000000',
		gps: [40.9737394, 56.9984452]
	},
 	 street: {
		name: 'Строителей',
		zip: 153038,
		type: 'Проспект',
		typeShort: 'пр-кт',
		okato: '24401000000',
		contentType: 'street',
		id: '37000001000098000',
		code: 'ru',
		lat: '56.9686335',
		lng: '41.0111737',
		gps: [41.0111737, 56.9686335],
		timezone: {
			dstOffset: 0,
			rawOffset: 10800,
			timeZoneId: 'Europe/Moscow',
			timeZoneName: 'Москва, стандартное время'
		},
		regionId: '3700000000000',
		cityId: '3700000100000'
	}
}
```

> данные извлекаются из локальной базы, и если каких-то субъектов в базе нет, то данный запрос результата не даст. В таком случае следует использовать метод **findAddress**

---

**findAddress** - Поиск данных адреса по строке

#### Параметры запроса:

```
address - Адрес для интерпретации данных (разделение запятыми субъектов обязательно) *
```

#### запрос:

```
address = Россия Ивановская область г.Иваново пр-т.Строителей
```

#### ответ:

```js
{
	country: {
		name: 'Россия',
		type: 'Страна',
		typeShort: 'ст-а',
		contentType: 'country',
		nameFull: 'Российская Федерация',
		nameShort: 'РФ',
		id: '7',
		code: 'ru',
		lat: 61.52401,
		lng: 105.318756,
		gps: [ 105.318756, 61.52401 ],
		timezone: {
			dstOffset: 0,
			rawOffset: 25200,
			timeZoneId: 'Asia/Krasnoyarsk',
			timeZoneName: 'Красноярск, стандартное время'
		}
	},
	region: {
		name: 'Ивановская',
		zip: null,
		type: 'Область',
		typeShort: 'обл',
		okato: '24000000000',
		contentType: 'region',
		id: '3700000000000',
		code: 'ru',
		lat: 57.1056854,
		lng: 41.4830084,
		gps: [41.4830084, 57.1056854],
		timezone: {
			dstOffset: 0,
			rawOffset: 10800,
			timeZoneId: 'Europe/Moscow',
			timeZoneName: 'Москва, стандартное время'
		}
	},
	district: false,
	city: {
		timezone: {
			timeZoneName: 'Москва, стандартное время',
			timeZoneId: 'Europe/Moscow',
			rawOffset: 10800,
			dstOffset: 0
		},
		id: '3700000100000',
		name: 'Иваново',
		zip: 153015,
		type: 'Город',
		typeShort: 'г',
		okato: '24401000000',
		contentType: 'city',
		code: 'ru',
		lat: '56.9984452',
		lng: '40.9737394',
		regionId: '3700000000000',
		gps: [40.9737394, 56.9984452]
	},
 	 street: {
		name: 'Строителей',
		zip: 153038,
		type: 'Проспект',
		typeShort: 'пр-кт',
		okato: '24401000000',
		contentType: 'street',
		id: '37000001000098000',
		code: 'ru',
		lat: '56.9686335',
		lng: '41.0111737',
		gps: [41.0111737, 56.9686335],
		timezone: {
			dstOffset: 0,
			rawOffset: 10800,
			timeZoneId: 'Europe/Moscow',
			timeZoneName: 'Москва, стандартное время'
		},
		regionId: '3700000000000',
		cityId: '3700000100000'
	}
}
```

> Разница между методом **findAddress** и **getAddress** заключается в том, что данный метод ищет данные не только в своей базе но и за пределами в интернете, следовательно выполнятся он будет дольше и нагрузка на систему будет выше чем у getAddress

---

**findCountry** - Поиск страны

#### Параметры запроса:

```
str - Начальные символы названия страны *
limit - Количество запрашиваемых данных (максимум 100, по умолчанию 10)
```

#### запрос:

```
str = Россия
limit = 1
```

#### ответ:

```js
[{
	name: 'Россия',
	type: 'Страна',
	typeShort: 'ст-а',
	contentType: 'country',
	nameFull: 'Российская Федерация',
	nameShort: 'РФ',
	id: '7',
	code: 'ru',
	lat: 61.52401,
	lng: 105.318756,
	gps: [105.318756, 61.52401],
	timezone: {
		dstOffset: 0,
		rawOffset: 25200,
		timeZoneId: 'Asia/Krasnoyarsk',
		timeZoneName: 'Красноярск, стандартное время'
	}
}]
```

> поиск стран происходит как внутри локальной базы так и за её пределами в интернете если в локальной базе данные не найдены