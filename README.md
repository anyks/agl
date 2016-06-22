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
address - Адрес для интерпретации данных (субъекты должны быть разделены запятыми) *
```

#### запрос:

```
address = страна Российская Федерация, Ивановская область, Южский район, город Южа, улица Смирнова, дом 6, квартира 51
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

---

**findRegion** - Поиск региона

#### Параметры запроса:

```
str - Начальные символы названия региона *
limit - Количество запрашиваемых данных (максимум 100, по умолчанию 10)
```

#### запрос:

```
str = Ивановская
limit = 1
```

#### ответ:

```js
[{
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
}]
```

> поиск регионов происходит как внутри локальной базы так и за её пределами в интернете если в локальной базе данные не найдены

---

**findDistrict** - Поиск районов в регионе

#### Параметры запроса:

```
str - Начальные символы названия района *
regionId - Идентификатор региона
limit - Количество запрашиваемых данных (максимум 100, по умолчанию 10)
```

#### запрос:

```
str = Южский
regionId = 3700000000000
limit = 1
```

#### ответ:

```js
[{
	name: 'Южский',
	zip: 155635,
	type: 'Район',
	typeShort: 'р-н',
	okato: '24235000000',
	contentType: 'district',
	id: '3702000000000',
	code: 'ru',
	lat: 56.6089536,
	lng: 42.0256303,
	gps: [42.0256303, 56.6089536],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000'
}]
```

> поиск районов происходит как внутри локальной базы так и за её пределами в интернете если в локальной базе данные не найдены

---

**findCity** - Поиск городов в регионе или районе

#### Параметры запроса:

```
str - Начальные символы названия города *
regionId - Идентификатор региона
districtId - Идентификатор района
limit - Количество запрашиваемых данных (максимум 100, по умолчанию 10)
```

#### запрос:

```
str = Южа
regionId = 3700000000000
limit = 1
```

#### ответ:

```js
[{
	id: '3702000100000',
	name: 'Южа',
	zip: 155630,
	type: 'Город',
	typeShort: 'г',
	okato: '24235501000',
	contentType: 'city',
	code: 'ru',
	lat: '56.584042',
	lng: '42.010929',
	regionId: '3700000000000',
	districtId: '3702000000000',
	gps: [42.010929, 56.584042],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
}]
```

> поиск городов происходит как внутри локальной базы так и за её пределами в интернете если в локальной базе данные не найдены

---

**findStreet** - Поиск улиц в городе

#### Параметры запроса:

```
str - Начальные символы названия улицы *
cityId - Идентификатор города
limit - Количество запрашиваемых данных (максимум 100, по умолчанию 10)
```

#### запрос:

```
str = Строителей
cityId = 3700000100000
limit = 1
```

#### ответ:

```js
[{
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
	metro: [],
	gps: [41.0111737, 56.9686335],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000',
	cityId: '3700000100000'
}]
```

> поиск улиц происходит как внутри локальной базы так и за её пределами в интернете если в локальной базе данные не найдены

---

**findHouse** - Поиск домов на улице

#### Параметры запроса:

```
str - Первые строки в названии дома *
streetId - Идентификатор улицы где производится поиск
limit - Лимит вариантов к выдаче (по умолчанию 10, максимум 100)
```

#### запрос:

```
str = 3
streetId = 37019001000027900
limit = 1
```

#### ответ:

```js
[{
	name: '3',
	zip: 155900,
	type: 'дом',
	typeShort: 'д',
	okato: '24411000000',
	contentType: 'building',
	id: '3701900100002790010',
	code: 'ru',
	lat: '56.8400475',
	lng: '41.3907855',
	gps: [41.3907855, 56.8400475],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000',
	districtId: '3701900000000',
	cityId: '3701900100000',
	streetId: '37019001000027900'
}]
```

> поиск домов происходит как внутри локальной базы так и за её пределами в интернете если в локальной базе данные не найдены

---

**findMetro** - Поиск метро

#### Параметры запроса:

```
str - Первые строки в названии станции *
cityId - Идентификатор города где находится станция
limit - Лимит вариантов к выдаче (по умолчанию 10, максимум 100)
lineId - Идентификатор линии где находится станция
lineName - Название линии где находится станция
lineColor - Цвет линии где находится станция
```

#### запрос:

```
str = Румянцево
cityId = 7700000000000
limit = 1
```

#### ответ:

```js
[{
	id: '975c23bb4d69e2efc343cf11',
	name: 'Румянцево',
	lat: '55.633',
	lng: '37.4419',
	order: 20,
	line: 'Сокольническая',
	color: 'E42313',
	city: 'Москва',
	lineId: '31b83c4d182032e41ad85357',
	cityId: '7700000000000',
	gps: [37.4419, 55.633]
}]
```

---

**findNearStationsMetroByIds** - Поиск по массиву идентификаторов станций метро, ближайших к ним станций метро

#### Параметры запроса:

```
ids - Массив идентификаторов станций метро *
distance - Расстояние поиска в метрах (по умолчанию 5000)
```

#### запрос:

```
ids = 975c23bb4d69e2efc343cf11, c3900aa9021cec3fce26bb41
```

#### ответ:

```js
[{
	metro: {
		id: '975c23bb4d69e2efc343cf11',
		name: 'Румянцево',
		lat: '55.633',
		lng: '37.4419',
		order: 20,
		line: 'Сокольническая',
		color: 'E42313',
		city: 'Москва',
		lineId: '31b83c4d182032e41ad85357',
		cityId: '7700000000000',
		gps: [37.4419, 55.633]
	},
	near: [{
		id: '07fad26e60a6a0378d211c87',
		name: 'Саларьево',
		lat: '55.6227',
		lng: '37.424',
		order: 21,
		line: 'Сокольническая',
		color: 'E42313',
		city: 'Москва',
		lineId: '31b83c4d182032e41ad85357',
		cityId: '7700000000000',
		gps: [37.424, 55.6227]
	}, {
		id: 'c4fca5a3388d09a6d04cdde2',
		name: 'Тропарево',
		lat: '55.6459',
		lng: '37.4725',
		order: 19,
		line: 'Сокольническая',
		color: 'E42313',
		city: 'Москва',
		lineId: '31b83c4d182032e41ad85357',
		cityId: '7700000000000',
		gps: [37.4725, 55.6459]
	}, {
		id: '943f7c7793a06fcf3809d6b1',
		name: 'Юго-Западная',
		lat: '55.663146',
		lng: '37.482852',
		order: 18,
		line: 'Сокольническая',
		color: 'E42313',
		city: 'Москва',
		lineId: '31b83c4d182032e41ad85357',
		cityId: '7700000000000',
		gps: [37.482852, 55.663146]
	}, {
		id: '1db098df0a53fbda33d52d8e',
		name: 'Теплый Стан',
		lat: '55.61873',
		lng: '37.505912',
		order: 21,
		line: 'Калужско-Рижская',
		color: 'F07E24',
		city: 'Москва',
		lineId: '84aa74bc75c408fdd995998f',
		cityId: '7700000000000',
		gps: [37.505912, 55.61873]
	}, {
		id: 'da82d147d1db1a39bb48b0d1',
		name: 'Коньково',
		lat: '55.631857',
		lng: '37.519156',
		order: 20,
		line: 'Калужско-Рижская',
		color: 'F07E24',
		city: 'Москва',
		lineId: '84aa74bc75c408fdd995998f',
		cityId: '7700000000000',
		gps: [37.519156, 55.631857]
	}]
}, {
	metro: {
		id: 'c3900aa9021cec3fce26bb41',
		name: 'Горьковская',
		lat: '56.313933',
		lng: '43.99482',
		order: 0,
		line: 'Автозаводская',
		color: 'D80707',
		city: 'Нижний Новгород',
		lineId: '874a3d2cdebc6d1bc5db1d49',
		cityId: '5200000100000',
		gps: [43.99482, 56.313933]
	},
	near: [{
		id: 'f97005fe546a9d76ddb8542b',
		name: 'Московская',
		lat: '56.321097',
		lng: '43.945799',
		order: 1,
		line: 'Автозаводская',
		color: 'D80707',
		city: 'Нижний Новгород',
		lineId: '874a3d2cdebc6d1bc5db1d49',
		cityId: '5200000100000',
		gps: [43.945799, 56.321097]
	}, {
		id: '15718ec80fc1fa9c89f23e47',
		name: 'Московская 2',
		lat: '56.321097',
		lng: '43.945799',
		order: 0,
		line: 'Сормовская',
		color: '0071BC',
		city: 'Нижний Новгород',
		lineId: '7f8ebb791fff539ddf71d161',
		cityId: '5200000100000',
		gps: [43.945799, 56.321097]
	}, {
		id: '63f6e64c94533b06cd4f12d6',
		name: 'Чкаловская',
		lat: '56.310637',
		lng: '43.936933',
		order: 2,
		line: 'Автозаводская',
		color: 'D80707',
		city: 'Нижний Новгород',
		lineId: '874a3d2cdebc6d1bc5db1d49',
		cityId: '5200000100000',
		gps: [43.936933, 56.310637]
	}, {
		id: 'd28612dc4d850c65f3a0c9e0',
		name: 'Ленинская',
		lat: '56.297798',
		lng: '43.937328',
		order: 3,
		line: 'Автозаводская',
		color: 'D80707',
		city: 'Нижний Новгород',
		lineId: '874a3d2cdebc6d1bc5db1d49',
		cityId: '5200000100000',
		gps: [43.937328, 56.297798]
	}, {
		id: 'f9473daa97e585b561cabc76',
		name: 'Канавинская',
		lat: '56.320273',
		lng: '43.927438',
		order: 1,
		line: 'Сормовская',
		color: '0071BC',
		city: 'Нижний Новгород',
		lineId: '7f8ebb791fff539ddf71d161',
		cityId: '5200000100000',
		gps: [43.927438, 56.320273]
	}]
}]
```

---

**findMetroById** - Поиск метро по идентификатору станции метро

#### Параметры запроса:

```
id - Идентификатор станции метро *
```

#### запрос:

```
id = 975c23bb4d69e2efc343cf11
```

#### ответ:

```js
{
	id: '975c23bb4d69e2efc343cf11',
	name: 'Румянцево',
	lat: '55.633',
	lng: '37.4419',
	order: 20,
	line: 'Сокольническая',
	color: 'E42313',
	city: 'Москва',
	lineId: '31b83c4d182032e41ad85357',
	cityId: '7700000000000',
	gps: [37.4419, 55.633]
}
```

---

**findMetroByStreetId** - Поиск метро по идентификатору улицы

#### Параметры запроса:

```
id - Идентификатор улицы *
```

#### запрос:

```
id = 77000000000095300
```

#### ответ:

```js
[{
	id: '2f3b45576732245a55297b2d',
	name: 'Проспект Вернадского',
	lat: '55.676549',
	lng: '37.504584',
	order: 17,
	line: 'Сокольническая',
	color: 'E42313',
	city: 'Москва',
	lineId: '31b83c4d182032e41ad85357',
	cityId: '7700000000000',
	gps: [37.504584, 55.676549]
}, {
	id: '943f7c7793a06fcf3809d6b1',
	name: 'Юго-Западная',
	lat: '55.663146',
	lng: '37.482852',
	order: 18,
	line: 'Сокольническая',
	color: 'E42313',
	city: 'Москва',
	lineId: '31b83c4d182032e41ad85357',
	cityId: '7700000000000',
	gps: [37.482852, 55.663146]
}]
```

---

**findMetroByHouseId** - Поиск метро по идентификатору дома

#### Параметры запроса:

```
id - Идентификатор дома *
```

#### запрос:

```
id = 7700000000009530044
```

#### ответ:

```js
[{
	id: '2f3b45576732245a55297b2d',
	name: 'Проспект Вернадского',
	lat: '55.676549',
	lng: '37.504584',
	order: 17,
	line: 'Сокольническая',
	color: 'E42313',
	city: 'Москва',
	lineId: '31b83c4d182032e41ad85357',
	cityId: '7700000000000',
	gps: [37.504584, 55.676549]
}, {
	id: '943f7c7793a06fcf3809d6b1',
	name: 'Юго-Западная',
	lat: '55.663146',
	lng: '37.482852',
	order: 18,
	line: 'Сокольническая',
	color: 'E42313',
	city: 'Москва',
	lineId: '31b83c4d182032e41ad85357',
	cityId: '7700000000000',
	gps: [37.482852, 55.663146]
}]
```

---

**hintCountries** - Подсказки по странам

#### Параметры запроса:

```
str - Подстрока для поиска *
```

#### запрос:

```
str = Ро
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

> подсказки работают за счет кэширования данных, если в кэше данных нет то подсказки работать не будут и данные сначала нужно загрузить с помощью метода **findCountry**

---

**hintRegions** - Подсказки по регионам

#### Параметры запроса:

```
str - Подстрока для поиска *
```

#### запрос:

```
str = Ив
```

#### ответ:

```js
[{
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
}]
```

> подсказки работают за счет кэширования данных, если в кэше данных нет то подсказки работать не будут и данные сначала нужно загрузить с помощью метода **findRegion**

---

**hintDistricts** - Подсказки по районам

#### Параметры запроса:

```
str - Подстрока для поиска *
regionId - Идентификатор региона
```

#### запрос:

```
str = Шу
regionId = 3700000000000
```

#### ответ:

```js
[{
	name: 'Шуйский',
	zip: 155903,
	type: 'Район',
	typeShort: 'р-н',
	okato: '24233000000',
	contentType: 'district',
	id: '3701900000000',
	code: 'ru',
	lat: 56.7586237,
	lng: 41.3915336,
	gps: [41.3915336, 56.7586237],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000'
}]
```

> подсказки работают за счет кэширования данных, если в кэше данных нет то подсказки работать не будут и данные сначала нужно загрузить с помощью метода **findDistrict**

---

**hintCities** - Подсказки по городам

#### Параметры запроса:

```
str - Подстрока для поиска *
regionId - Идентификатор региона
districtId - Идентификатор района
```

#### запрос:

```
str = Шу
regionId = 3700000000000
```

#### ответ:

```js
[{
	name: 'Шуя',
	zip: 155905,
	type: 'Город',
	typeShort: 'г',
	okato: '24411000000',
	contentType: 'city',
	id: '3701900100000',
	code: 'ru',
	lat: '56.8441',
	lng: '41.3796',
	gps: [41.3796, 56.8441],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000',
	districtId: '3701900000000'
}]
```

> подсказки работают за счет кэширования данных, если в кэше данных нет то подсказки работать не будут и данные сначала нужно загрузить с помощью метода **findCity**

---

**hintStreets** - Подсказки по улицам

#### Параметры запроса:

```
str - Подстрока для поиска *
cityId - Идентификатор города
```

#### запрос:

```
str = Св
cityId = 3701900100000
```

#### ответ:

```js
[{
	name: 'Свердлова',
	zip: 155908,
	type: 'Улица',
	typeShort: 'ул',
	okato: '24411000000',
	contentType: 'street',
	id: '37019001000027900',
	code: 'ru',
	lat: '56.8400475',
	lng: '41.3907855',
	gps: [41.3907855, 56.8400475],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000',
	districtId: '3701900000000',
	cityId: '3701900100000'
}]
```

> подсказки работают за счет кэширования данных, если в кэше данных нет то подсказки работать не будут и данные сначала нужно загрузить с помощью метода **findStreet**

---

**hintHouses** - Подсказки по домам

#### Параметры запроса:

```
str - Подстрока для поиска *
streetId - Идентификатор улицы
```

#### запрос:

```
str = 30
streetId = 37019001000027900
```

#### ответ:

```js
[{
	name: '30',
	zip: 155900,
	type: 'дом',
	typeShort: 'д',
	okato: '24411000000',
	contentType: 'building',
	id: '3701900100002790010',
	code: 'ru',
	lat: '56.8400475',
	lng: '41.3907855',
	gps: [41.3907855, 56.8400475],
	timezone: {
		dstOffset: 0,
		rawOffset: 10800,
		timeZoneId: 'Europe/Moscow',
		timeZoneName: 'Москва, стандартное время'
	},
	regionId: '3700000000000',
	districtId: '3701900000000',
	cityId: '3701900100000',
	streetId: '37019001000027900'
}]
```

> подсказки работают за счет кэширования данных, если в кэше данных нет то подсказки работать не будут и данные сначала нужно загрузить с помощью метода **findHouse**