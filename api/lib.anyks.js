/* БИБЛИОТЕКА ИНСТРУМЕНТОВ */
/*
*	автор:				Юрий Николаевич Лобарев
*	skype:				efrantick
*	телефон:			+7(910) 983-95-90
*	авторские права:	Все права принадлежат автору © Юрий Лобарев, 2016
*/
// Включаем строгий режим
"use strict";
// Функция активации сервера
(function(){
	/**
	 * Класс Anyks с базовыми методами
	 */
	class Anyks {
		/* СТАТИЧЕСКИЕ МЕТОДЫ */
		// console.log( "При\u0301вет" ); // При́вет
		/*
		// Цвета
		'\x1B[30m' + 'black' + '\x1B[39m'
		'\x1B[31m' + 'red' + '\x1B[39m'
		'\x1B[32m' + 'green' + '\x1B[39m'
		'\x1B[33m' + yellow + '\x1B[39m'
		'\x1B[34m' + blue + '\x1B[39m'
		'\x1B[35m' + magenta + '\x1B[39m'
		'\x1B[36m' + cyan + '\x1B[39m'
		'\x1B[37m' + white + '\x1B[39m'
		'\x1B[90m' + gray + '\x1B[39m'
		// Фон
		'\x1B[40m' + 'black' + '\x1B[49m'
		'\x1B[41m' + 'red' + '\x1B[49m'
		'\x1B[42m' + 'green' + '\x1B[49m'
		'\x1B[43m' + yellow + '\x1B[49m'
		'\x1B[44m' + blue + '\x1B[49m'
		'\x1B[45m' + magenta + '\x1B[49m'
		'\x1B[46m' + cyan + '\x1B[49m'
		'\x1B[47m' + white + '\x1B[49m'
		// Стили
		'\x1B[0m' + reset + '\x1B[0m'
		'\x1B[1m' +  'bold' + '\x1B[22m'
		'\x1B[2m' + dim + '\x1B[22m'
		'\x1B[3m' + italic + '\x1B[23m'
		'\x1B[4m' + 'underline' + '\x1B[24m'
		'\x1B[7m' + inverse + '\x1B[27m'
		'\x1B[8m' + hidden + '\x1B[28m'
		'\x1B[9m' + strikethrough + '\x1B[29m'
		// Наработки
		'\x1B[31m' + R + '\x1B[39m\x1B[33m' + A + '\x1B[39m\x1B[32m' + N + '\x1B[39m' - rainbow
		'R' + '\x1B[7m' + A + '\x1B[27m' + N - zebra
		*/
		// декоратор скрывает обращение к другому объекту.
		/**
		 * parseInt Функция приведения числа к типу Int
		 * @param  {String} строковое значение числа
		 * @return {Number} полученное число
		 */
		static parseInt(val){return (val) >> 0;}
		/**
		 * isFunction Проверка существование функции
		 * @param  {Function}  func функция для проверки
		 * @return {Boolean}        результат проверки
		 */
		static isFunction(func){
			return (typeof(func) === "function" ? true : false);
		}
		/**
		 * isString Проверка существование строки
		 * @param  {String}   str функция для проверки
		 * @return {Boolean}      результат проверки
		 */
		static isString(str){
			return (typeof(str) === "string" ? true : false);
		}
		/**
		 * isSymbol Проверка существование symbol
		 * @param  {String}   sym символ для проверки
		 * @return {Boolean}      результат проверки
		 */
		static isSymbol(sym){
			return (typeof(sym) === "symbol" ? true : false);
		}
		/**
		 * isNumber Проверка на то число это или нет
		 * @param  {Number}  number число для проверки
		 * @return {Boolean}        результат проверки
		 */
		static isNumber(number){
			return (typeof(number) === "number" ? true : false);
		}
		/**
		 * isBoolean Проверка на булевое значение
		 * @param  {Boolean}  bool булевое значение для проверки
		 * @return {Boolean}       результат проверки
		 */
		static isBoolean(bool){
			return (typeof(bool) === "boolean" ? true : false);
		}
		/**
		 * isObject Проверка на то объект это или нет
		 * @param  {Object}  object число для проверки
		 * @return {Boolean}        результат проверки
		 */
		static isObject(object){
			return (typeof(object) === "object" ? true : false);
		}
		/**
		 * isArray Функция определения является ли элемент массивом
		 * @param  {Array}  arr  массив для проверки
		 * @return {Boolean}     результат проверки
		 */
		static isArray(arr){
			// Если это массив
			return Array.isArray(arr);
		}
		/**
		 * isset Функция возвращает true если данные не пустые
		 * @param  {Variant} data абстрактная величина для проверки
		 * @return {Boolean}      результат проверки
		 */
		static isset(data){
			try {
				// Карта для поиска значений
				const map = [
					-1,
					undefined,
					null,
					"",
					"-1",
					"0",
					"false",
					"none",
					"null",
					"undefined",
					"not result"
				];
				// Переходим по всей карте проверок
				for(let val of map){
					// Если найден один из элементов в списке тогда сообщаем что тест проверку не прошёл
					if(!data || (val === (Anyks.isString(data)
					? data.toString().toLowerCase() : data))) return false;
				}
				// Сообщаем что тест проверку прошёл
				return true;
			} catch(e) {return false;}
		}
		/**
		 * inArray Функция поиска в массиве указанного значения
		 * @param  {Variant} elem элемент для поиска в массиве
		 * @param  {Array}   arr  массив в котором осуществляется поиск
		 * @param  {Number}  i    индекс массива с которого нужно начать
		 * @return {Number}       индекс массива в котором найден элемент
		 */
		static inArray(elem, arr, i = 0){
			if(Anyks.isArray(arr)){
				(i = i ? (i < 0 ? Math.max(0, arr.length + i) : i) : 0);
				for(; i < arr.length; i++){
					// Skip accessing in sparse arrays
					if(i in arr && (arr[i] === elem)) return i;
				}
			}
			return -1;
		}
		/**
		 * each Рекурсивная функция перебора массива с функцией обратного вызова
		 * @param  {Array}    data     массив для обхода
		 * @param  {Function} each     функция обратного вызова которая срабатывает на каждом элементе
		 * @param  {Function} callback функция обратного вызова при завершении обхода
		 */
		static each(data, each, callback){
			// Если функция перехода по массиву существует
			if(Anyks.isFunction(each) && Anyks.isArray(data)){
				// Размер массива
				const len = data.length;
				// Рекурсивная функция перехода по массиву
				let __each = (i = 0) => {
					// Если индекс массива еще не дошел до конца
					if(i < len){
						// Возвращаем результат перехода по массиву
						each.call(Anyks, i, data[i]);
						// Выполняем рекурсивно функцию снова
						__each(i++);
					// Если массив весь перебран до конца
					} else {
						// Выполняем функцию обратного вызова
						if(Anyks.isFunction(callback)) callback.call(Anyks, data, len);
						// Выходим из функции
						return;
					}
				};
				// Запускаем рекурсию
				__each();
			}
		}
		/**
		 * build_ident Функция генерирования уникального идентификатора
		 * @return {String} уникальный идентификатор
		 */
		static build_ident(){
			// Генерируем timestamp
			let ident = (() => (new Date).valueOf().toString())();
			// Создаем уникальный идентификатор, случайное число от текущего значения миллисекунд до полного числа
			return Math.floor(Math.random() * (parseInt(ident, 10) - parseInt(ident[3], 10) + 1)) + parseInt(ident[6], 10);
		}
		/**
		 * floorN Функция округления до определенного количества знаков после запятой
		 * @param  {Number} x число для округления
		 * @param  {Number} n количество знаков после запятой
		 * @return {Number}   округлённое число
		 */
		static floorN(x, n){
			const mult = Math.pow(10, n);
			return Math.floor(x * mult) / mult;
		}
		/**
		 * random_number_array Функция генерирования массива случайных чисел с указанным диапазоном Data без повторений 
		 * @param  {Number} data диапазон значений массива
		 * @return {Arrey}       массив случайных чисел с указанным диапазоном Data без повторений
		 */
		static random_number_array(data){
			// Если данные существуют
			if(Anyks.isset(data)){
				// Генерируем случайное значение и предварительно запоминаем их для того чтобы результат не повторялся
				// Создаем временные массивы чисел
				const A = new Array(data + 1);
				const B = new Array(data + 1);
				// Заполняем массивы нулями
				Anyks.each(B, i => {
					B[i] = 0;
					A[i] = 0;
				});
				// Переменная флаг для завершения строки поиска
				let povorot;
				// Переходим по всему массиву А
				for(let i = 1; i < A.length; i++){
					// Устанавливаем флаг начала поиска
					povorot = true;
					// Выполняем переход до тех пор пока не будет найден не повторяющееся число
					while(povorot){
						// Генерируем случайное число
						A[i] = Math.floor(Math.random() * ((A.length - 1) + 1));
						// Если случайное число больше нуля
						if(A[i] > 0){
							// Если в массиве В под индексом случайного числа находится 0
							if(B[A[i]] === 0){
								// Заменяем 0 найденым случайным числом
								B[A[i]] = A[i];
								// Выходим из поиска чисел и продолжаем поиск для следующего индекса
								povorot = false;
							}
						}
					}
				}
				// Формируем окончательный результат
				//B[A.length - 1]; // Перераспределяем массив B
				// Заполняем массив B случайными числами из массива А при этом перемешиваем их
				for(let i = 0; i < (B.length - 1); i++) B[i] = A[i + 1] - 1;
				// Так как в нашем случае, последнее число в массиве всегда будет одно и тоже
				// Мы меняем его случайным образом с другим индексом в массиве
				// Генерируем случайное число
				const mt = Math.floor(Math.random() * ((B.length - 1) + 1));
				// Запоминаем значение в массиве В с полученным случайным индексом
				const dt = B[mt];
				// Копируем в массив В со случайным индексом число из последнего индекса
				B[mt] = B[B.length - 1];
				// Копируем в массив В с последним индексом, число из массива В со случайным индексом, тем самым меняя их местами
				B[B.length - 1] = dt;
				// Возвращаем результат
				return B;
			}
		}
		/**
		 * addZerro Функция добавляет 0 к числу
		 * @param {String} val строковое значение числа
		 */
		static addZerro(val){
			// Если значение передано
			if(Anyks.isset(val)){
				// Выполняем приведение типов
				val = val.toString();
				// Проверяем длину строку
				if(val.length < 2) val = "0" + val;
				// Выводим результат
				return val;
			// Выводим просто нули
			} return "00";
		}
		/**
		 * fnShowProps Функция поиска параметра в объекте json
		 * @param  {Object}  obj объект в котором нужно найти параметр
		 * @param  {String}  key параметр объекта
		 * @param  {Variant} def параметр по умолчанию
		 * @return {Variant}     найденный результат
		 */
		static fnShowProps(obj, key, def = null){
			// Если данный ключ уже найден
			if(Anyks.isset(obj[key])) return obj[key];
			// Заполняем массив результатами поиска на каждый ключ
			for(let item in obj){
				// Получаем данные на каждый ключ
				const result = (
					Anyks.isset(obj[item]) &&
					Anyks.isObject(obj[item]) ?
					Anyks.fnShowProps(obj[item], key, def) : false
				);
				// Если результат существует
				if(result) return result;
			}
			// Выводим данные по умолчанию
			return def;
		}
		/**
		 * returnObject Функция извлекает ссылки на параметры объекта игнорируя указанный
		 * @param  {Object} obj    объект в котором нужно получить данные
		 * @param  {String} ignore параметр который нужно проигнорировать
		 * @return {Object}        новый созданный объект
		 */
		static returnObject(obj, ignore){
			// Если параметр является объектом
			if((obj === null) || !Anyks.isObject(obj)) return obj;
			// Результирующий объект
			const result = {};
			// Копируем все данные кроме данные карты
			for(let i in obj){
				// Получаем флаг поиска
				let flag = (Anyks.isArray(ignore) ? (Anyks.inArray(i, ignore) < 0) : (i !== ignore));
				// Если эта не карта тогда копируем данные
				if(flag) result[i] = obj[i];
			}
			// Возвращаем результат
			return result;
		}
		/**
		 * cloneObject Функция клонирования объектов
		 * @param  {Object} obj  объект для клонирования
		 * @param  {String} type тип клонирования (string or null)
		 * @return {Object}      результирующий объект
		 */
		static cloneObject(obj, type = "string"){
			// Если параметр является объектом
			if(obj === null || !Anyks.isObject(obj)) return obj;
			// Проверяем тип преобразования
			switch(type.toLowerCase()){
				// Если тип парсинка простой json
				case "json":
					// Создаем новый блок данных
					let tmp = (Anyks.isArray(obj) ? [] : {});
					// Переходим по всему блоку данных
					for(let key in obj){
						// Если блок является строкой или числом
						if(Anyks.isString(obj[key])
						|| Anyks.isNumber(obj[key])
						|| Anyks.isBoolean(obj[key])
						// Запоминаем блок данных
						|| (obj[key] === null)) tmp[key] = obj[key];
						// Если блок является объектом
						else if(Anyks.isOjbect(obj[key])
						&& !Anyks.isset(obj[key]["jquery"])){
							// Запоминаем блок данных
							tmp[key] = Anyks.cloneObject(obj[key], type);
						}
					}
					// Возвращаем склонированный объект
					return tmp;
				// Если тип конвертации является строкой
				case "string":
					// Если это массив и пустой тогда возвращаем пустой массив
					if(Anyks.isArray(obj) && !obj.length) return [];
					// Если нужно применить метот string
					return JSON.parse(JSON.stringify(obj));
			}
		}
		/**
		 * equal Функция сравнения двух объектов
		 * @param  {Object} firstObject  первый объект для сравнения
		 * @param  {Object} secondObject второй объект для сравнения
		 * @return {Boolean}             результат сравнения
		 */
		static equal(firstObject, secondObject){
			try {
				// Если данные верны
				if(Anyks.isObject(firstObject)
				&& Anyks.isObject(secondObject)){
					// Очищаем данные
					firstObject		= Anyks.cloneObject(firstObject);
					secondObject	= Anyks.cloneObject(secondObject);
					// Функция сравнения данных
					Object.equal = function(firstObject, secondObject){
						if(Anyks.isObject(firstObject)
						&& Anyks.isObject(secondObject)){
							// Получаем список ключей объектов
							let keysFirstObj		= Object.keys(firstObject);
							let keysSecondObject	= Object.keys(secondObject);
							// Если размеры ключей не соответствуют
							if(keysFirstObj.length !== keysSecondObject.length) return false;
							// Возвращаем найденные данные
							return !keysFirstObj.filter(function(key){
								if(Anyks.isObject(firstObject[key])){
									return !Object.equal(firstObject[key], secondObject[key]);
								} else return firstObject[key] !== secondObject[key];
							}).length;
						}
						// Сообщаем что сравнение не удалось
						return false;
					};
					// Если данные существуют
					if(Anyks.isset(firstObject) && Anyks.isset(secondObject)){
						// Сравниваем данные и выводим результат
						return Object.equal(firstObject, secondObject);
					}
				}
				// Выводим что ничего не найдено
				return false;
			// Если возникает ошибка тогда выходим
			} catch(e) {return false;}
		}
		/**
		 * msecToTime Функция перевода милисекунд в дни
		 * @param  {Number} b timestamp для перевода в дни
		 * @return {String}   строковое значение даты
		 */
		static msecToTime(b){
			let a = b.toString();
			let i = 0, len = 0;
			let d = 0, h = 0, m = 0, s = 0, sec = 0;
			let dv1 = "", dv2 = "", probel = "";
			// Переходим по всем элементам
			while(a.substr(i, 1)){
				if(a.substr(0, 1) === " "){
					a = a.substr(1, 100);
					continue;
				}
				switch(a.substr(i, 1)){
					case " ": probel = i; break;
					case ":":
						if(!dv1) dv1 = i;
						else dv2 = i;
					break;
				}
				i++;
			}
			len = i;
			if(!dv1 && !dv2){
				d = Math.floor(a / 86400);
				a -= 86400 * d;
				h = Math.floor(a / 3600);
				a -= 3600 * h;
				m = Math.floor(a / 60);
				if(m < 10) m = "0" + m;
				s = Math.round(a - 60 * m);
				if(s < 10) s = "0" + s;
				return (d ? d + " " : "" + h + ":" + m + ":" + s);
			} else {
				if(probel) d = a.substr(0, probel) + " ";
				else d = 0;
				h = a.substr(probel + 1, dv1 - probel - 1);
				m = a.substr(dv1 + 1, dv2 - dv1 - 1);
				s = a.substr(dv2 + 1, len - dv2 - 1);
				sec = d * 86400;
				sec += h * 3600;
				sec += m * 60;
				sec += s * 1;
				return sec;
			}
		}
		/**
		 * formatSize Функция получения размера из числа
		 * @param  {Number} length Размер числа в байтах
		 * @param  {Array}  type   массив обозначений размеров например: ["б", "Кб", "Мб", "Гб", "Тб", "Пб"]
		 * @return {String}        строка с указанным размером
		 */
		static formatSize(length, type = ["b", "Kb", "Mb", "Gb", "Tb", "Pb"]){
			let i = 0; // Индекс массива
			// Если передается число
			if(Anyks.isNumber(length)){
				while((length / 1000 | 0)
				&& (i < type.length - 1)){
					length /= 1024;
					i++;
				}
				// Приписываем размер числа
				return length.toFixed(2) + " " + type[i];
			}
			// Выводим значение по умолчанию
			return "0 " + type[i];
		}
		/**
		 * random Функция генерации случайного значения
		 * @param  {Number} min  минимальное значение числа
		 * @param  {Number} max  максимальное значение числа
		 * @return {Number}      случайное число в указанном диапазоне
		 */
		static random(min, max){return Math.random() * (max - min) + min;}
		// Функции сортировки
		/**
		 * invertArray Перевернуть массив с задом на перед
		 * @param  {Array} arr исходный массив
		 * @return {Array}     результирующий массив
		 */
		static invertArray(arr){
			// Новый массив данных
			const result = [];
			// Индекс перехода по массиву
			let k = 0;
			// Переходим по всему массиву
			for(let i = (arr.length - 1); (i >= 0); i--){
				// Переворачиваем все данные
				result[k] = arr[i];
				k++;
			}
			// Возвращаем результат
			return result;
		}
		/*
		*	var arr = [1,2,3,4,5,6,7,8,9,10];
		*	arr.sort(ax.sIncrease); // Вернет [1,2,3,4,5,6,7,8,9,10]
		*	arr.sort(ax.sDecrease); // Вернет [10,9,8,7,6,5,4,3,2,1]
		*	arr.sort(ax.sRand); // Вернет случайно отсортированный массив, например [1,10,3,4,8,6,9,2,7,5]
		*/
		/**
		 * sIncrease По возрастанию
		 * @param  {Number} i  предыдущее значение массива
		 * @param  {Number} ii текущее значение массива
		 * @return {Number}    результат
		 */
		static sIncrease(i, ii){
			if(i > ii) return 1;
			else if(i < ii) return -1;
			else return 0;
		}
		/**
		 * sDecrease По убыванию
		 * @param  {Number} i  предыдущее значение массива
		 * @param  {Number} ii текущее значение массива
		 * @return {Number}    результат
		 */
		static sDecrease(i, ii){
			if(i > ii) return -1;
			else if(i < ii) return 1;
			else return 0;
		}
		/**
		 * sRand Случайная
		 */
		static sRand(){return Math.random() > 0.5 ? 1 : -1;}
		/**
		 * getRandomInt Функция генерации случайного значения от min до max
		 * @param  {Number} min минимальное значение
		 * @param  {Number} max максимальное значение
		 * @return {Number}     случайное значение в указанном диапазоне
		 */
		static getRandomInt(min, max){
			// Если это числа
			if(Anyks.isNumber(min) && Anyks.isNumber(max)){
				// Генерируем случайное число
				return Math.floor(Math.random() * (max - min + 1)) + min;
			}
			// Выводим нулевое значение
			return 0;
		}
		/**
		 * random_number_array Функция перераспределения массива для создания нового массива без повторений старого
		 * @param  {Array} data массив для перераспределения
		 * @return {Array}      перераспределенный массив
		 */
		static random_number_array(data){
			// Если данные существуют
			if(data.length){
				// Создаем новый массив
				let tmpArr = Anyks.random_number_array(data.length - 1);
				// Если начало нового массива равно концу старому то создаем новый массив
				while(tmpArr[0] === data[data.length - 1]){
					// Генерируем случайное значение
					tmpArr = Anyks.random_number_array(data.length - 1);
				}
				// Возвращаем результат
				return tmpArr;
			}
		}
		/**
		 * getArraySlice Функция прокрутки превью изображений
		 * @param  {Array}  a массив данных
		 * @param  {Number} i смещение
		 * @param  {Number} n размер нового массива
		 * @param  {Number} k количество элементов для выдачи
		 * @return {Array}    результирующий массив
		 */
		static getArraySlice(a, i, n, k){
			// Если нужно выдавать порциями по переданному количеству элементов
			if(k > 0) i *= k;
			let b = 0;
			if(i > 0){
				while(i !== 0){
					b++;
					if(b === a.length) b = 0;
					i--;
				}
			} else {
				i = Math.abs(i);
				while(i !== 0){
					b--;
					if(b < 0) b = a.length - 1;
					i--;
				}
			}
			let answer = {
				url:	[],
				id:		[]
			};
			for(let j = b; j < b + n; j++){
				if(j >= a.length){
					answer.url[answer.url.length] = a[j - a.length];
					answer.id[answer.id.length] = j - a.length;
				} else {
					answer.url[answer.url.length] = a[j];
					answer.id[answer.id.length] = j;
				}
			}
			return answer;
		}
		/**
		 * each_object Функция перехода по объекту данных
		 * @param  {Object}   object   объект для обхода
		 * @param  {Function} callback функция обратного вызова при каждой итерации
		 * @return {Object}            объект по завершению обхода
		 */
		static each_object(object, callback){
			let name, i = 0, rm = 0;
			// Если это не массив
			if(!Anyks.isArray(object)){
				for(name in object)
					if(!Anyks.isset(callback.call(object[name], name, object[name]))) break;
			// Если это массив
			} else if(Anyks.isArray(object)) {
				for(
					let value = object[0];
					Anyks.isset(i < object.length && callback.call(value, i, value));
					value = object[++i]
				) rm = i;
			}
			return object;
		}
		/**
		 * html Функция работа с html мнемониками
		 * @return {Object} результирующий объект
		 */
		static html(){
			// Мнемоники
			const mnem = {
				34: "quot", 38: "amp", 39: "apos", 60: "lt", 62: "gt", 402: "fnof",
				338: "OElig", 339: "oelig", 352: "Scaron", 353: "scaron",
				376: "Yuml", 710: "circ", 732: "tilde", 8226: "bull", 8230: "hellip",
				8242: "prime", 8243: "Prime", 8254: "oline", 8260: "frasl", 8472: "weierp",
				8465: "image", 8476: "real", 8482: "trade", 8501: "alefsym", 8592: "larr",
				8593: "uarr", 8594: "rarr", 8595: "darr", 8596: "harr", 8629: "crarr",
				8656: "lArr", 8657: "uArr", 8658: "rArr", 8659: "dArr", 8660: "hArr",
				8704: "forall", 8706: "part", 8707: "exist", 8709: "empty", 8711: "nabla",
				8712:"isin", 8713: "notin", 8715: "ni", 8719: "prod", 8721: "sum",
				8722: "minus", 8727: "lowast", 8730: "radic", 8733: "prop", 8734: "infin",
				8736: "ang", 8743: "and", 8744: "or", 8745: "cap", 8746: "cup", 8747: "int",
				8756: "there4", 8764: "sim", 8773: "cong", 8776: "asymp", 8800: "ne",
				8801: "equiv", 8804: "le", 8805: "ge", 8834: "sub", 8835: "sup", 8836: "nsub",
				8838: "sube", 8839: "supe", 8853: "oplus", 8855: "otimes", 8869: "perp",
				8901: "sdot", 8968: "lceil", 8969: "rceil", 8970: "lfloor", 8971: "rfloor",
				9001: "lang", 9002: "rang", 9674: "loz", 9824: "spades", 9827: "clubs",
				9829: "hearts", 9830: "diams", 8194: "ensp", 8195: "emsp", 8201: "thinsp",
				8204: "zwnj", 8205: "zwj", 8206: "lrm", 8207: "rlm", 8211: "ndash",
				8212: "mdash", 8216: "lsquo", 8217: "rsquo", 8218: "sbquo", 8220: "ldquo",
				8221: "rdquo", 8222: "bdquo", 8224: "dagger", 8225: "Dagger", 8240: "permil",
				8249: "lsaquo", 8250: "rsaquo", 8364: "euro", 977: "thetasym", 978: "upsih", 982: "piv"
			};
			// Таблица
			let tab = ("nbsp|iexcl|cent|pound|curren|yen|brvbar|sect|uml|"
			+ "copy|ordf|laquo|not|shy|reg|macr|deg|plusmn|sup2|sup3|"
			+ "acute|micro|para|middot|cedil|sup1|ordm|raquo|frac14|"
			+ "frac12|frac34|iquest|Agrave|Aacute|Acirc|Atilde|Auml|"
			+ "Aring|AElig|Ccedil|Egrave|Eacute|Ecirc|Euml|Igrave|"
			+ "Iacute|Icirc|Iuml|ETH|Ntilde|Ograve|Oacute|Ocirc|Otilde|"
			+ "Ouml|times|Oslash|Ugrave|Uacute|Ucirc|Uuml|Yacute|THORN|"
			+ "szlig|agrave|aacute|acirc|atilde|auml|aring|aelig|ccedil|"
			+ "egrave|eacute|ecirc|euml|igrave|iacute|icirc|iuml|eth|ntilde|"
			+ "ograve|oacute|ocirc|otilde|ouml|divide|oslash|ugrave|uacute|"
			+ "ucirc|uuml|yacute|thorn|yuml").split("|");
			for(let x = 0; x < 96; x++) mnem[160 + x] = tab[x];
			tab = ("Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|"
			+ "Lambda|Mu|Nu|Xi|Omicron|Pi|Rho").split("|");
			for(let x = 0; x < 17; x++) mnem[913 + x] = tab[x];
			tab = ("Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega").split("|");
			for(let x = 0; x < 7; x++) mnem[931 + x] = tab[x];
			tab = ("alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|"
			+ "lambda|mu|nu|xi|omicron|pi|rho|sigmaf|sigma|tau|upsilon|phi|chi|"
			+ "psi|omega").split("|");
			for(let x = 0; x < 25; x++) mnem[945 + x] = tab[x];
			// Выводим объект с кодированным и декодированным текстом
			return {
				encode: text => {
					return text.replace(/[\u00A0-\u2666<>\&]/g, a => {
						return "&" + (mnem[a = a.charCodeAt(0)] || "#" + a) + ";";
					});
				},
				decode: text => {
					return text.replace(/\&#?(\w+);/g, (a, b) => {
						if(Number(b)) return String.fromCharCode(Number(b));
						for(let x in mnem) if(mnem[x] === b) return String.fromCharCode(x);
					});
				}
			};
		}
		/**
		 * htmlspecialchars_encode Функция кодирования html текста
		 * @param  {String}   string  строка текста для кодирования
		 * @param  {Boolean}  reverse нужно ли отменить перевод
		 * @return {String}           результирующая строка
		 */
		static htmlspecialchars_encode(string, reverse){
			// specialChars это список символов и их сущностей
			// specialChars["<"] = "&lt;";
			// x — простая переменная, используемая в циклах
			let specialChars = {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				"\"": "&quot;"
			};
			// Если мы отменяем перевод
			if(Anyks.isset(reverse)){
				// Нужно создать временный массив
				reverse = [];
				// Помещаем каждый специальный символ в массив
				for(let i in specialChars) reverse.push(i);
				// Создаем обратный массив
				// ["<", ">"] становится [">", "<"]
				reverse.reverse();
				// Для каждого специального символа:
				for(let i = 0; i < reverse.length; i++)
					// Заменяем все экземпляры (g) сущности оригиналом
					// если x = 1, то
					// reverse[x] = reverse[1] = ">";
					// specialChars[reverse[x]] = specialChars[">"] = "&gt;";
					string = string.replace(
						new RegExp(specialChars[reverse[i]], "g"),
						reverse[i]
					);
				// Получаем оригинальную строку
				return string;
			}
			// Если нам нужно не получать оригинал, а перевести строку в сущности
			// Для каждого специального символа:
			for(let i in specialChars)
				// Заменяем все экземпляры специального символа его сущностью
				// Запомните, в отличие от обратного алгоритма, где x была числом
				// здесь х это необходимый символ (&, <, > или ")
				string = string.replace(new RegExp(i, "g"), specialChars[i]);
			// Получаем переведенную строку.
			return string;
		}
		/**
		 * htmlspecialchars_decode Функция декодирования html текста
		 * @param  {String}   string  строка текста для кодирования
		 * @param  {Boolean}  reverse нужно ли отменить перевод
		 * @return {String}           результирующая строка
		 */
		static htmlspecialchars_decode(string, reverse){
			// specialChars это список символов и их сущностей
			// specialChars["<"] = "&lt;";
			// x — простая переменная, используемая в циклах
			let specialChars = {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				"\"": "&quot;"
			};
			// Если мы отменяем перевод
			if(Anyks.isset(reverse)){
				// Нужно создать временный массив
				reverse = [];
				// Помещаем каждый специальный символ в массив
				for(let i in specialChars) reverse.push(i);
				// Создаем обратный массив
				// ["<", ">"] становится [">", "<"]
				reverse.reverse();
				// Для каждого специального символа:
				for(let i = 0; i < reverse.length; i++)
					// Заменяем все экземпляры (g) сущности оригиналом
					// если x = 1, то
					// reverse[x] = reverse[1] = ">";
					// specialChars[reverse[x]] = specialChars[">"] = "&gt;";
					string = string.replace(
						new RegExp(reverse[i], "g"),
						specialChars[reverse[i]]
					);
				// Получаем оригинальную строку
				return string;
			}
			// Если нам нужно не получать оригинал, а перевести строку в сущности
			// Для каждого специального символа:
			for(let i in specialChars)
				// Заменяем все экземпляры специального символа его сущностью
				// Запомните, в отличие от обратного алгоритма, где x была числом
				// здесь х это необходимый символ (&, <, > или ")
				string = string.replace(new RegExp(specialChars[i], "g"), i);
			// Получаем переведенную строку.
			return string;
		}
		/**
		 * strip_tags Функция вырезания html тегов из текста
		 * @param  {String} str          исходная строка
		 * @param  {String} allowed_tags разрешенные теги
		 * @param  {String} separator    разделитель если необходим
		 * @return {String}              результирующая строка
		 */
		static strip_tags(str, allowed_tags, separator){
			let html			= "";
			let allowed			= false;
			const allowed_array	= [];
			// Функция заменяющая текст строку в тексте
			let replacer = (search, replace, str) => {
				return str.split(search).join(replace);
			};
			// Build allowes tags associative array
			if(allowed_tags) allowed_array = allowed_tags.match(/([a-zA-Z]+)/gi);
			// Удаляем из строки
			str += "";
			// Match tags
			let matches = str.match(/(<\/?[\S][^>]*>)/gi);
			// Go through all HTML tags
			for(let key in matches){
				// IE7 Hack
				if(isNaN(key)) continue;
				// Save HTML tag
				html = matches[key].toString();
				// Is tag not in allowed list? Remove from str!
				allowed = false;
				// Go through all allowed tags
				for(let i in allowed_array){
					// Init
					let allowed_tag = allowed_array[i];
					let j = -1;
					if(j !== 0) j = html.toLowerCase().indexOf("<" + allowed_tag + ">");
					if(j !== 0) j = html.toLowerCase().indexOf("<" + allowed_tag + " ");
					if(j !== 0) j = html.toLowerCase().indexOf("</" + allowed_tag);
					// Determine
					if(j === 0){
						allowed = true;
						break;
					}
				}
				// Custom replace. No regexing
				if(!allowed) str = replacer(html, ((typeof(separator) === "string") ? separator : ""), str);
			}
			return str;
		}
		/**
		 * clearTags Функция очистки тегов
		 * @param  {String} text текст с html тегами
		 * @return {String}      очищенный текст
		 */
		static clearTags(text){
			// Регулярное выражение для поиска
			const reg = /\<[a-z]+(\s+[\w\s\:\;\=\"\'\-]+)\>/;
			// Массив полученных тегов
			const arr = [];
			// Проверяем существует ли такой текст
			while(reg.test(text)){
				// Получаем текст
				arr = reg.exec(text);
				// Если массив существует
				if(Anyks.isArray(arr) && (arr.length === 2)){
					// Выполняем очистку
					text = text.replace(arr[1], "");
				// Выходим
				} else break;
			}
			// Возвращаем результат
			return text;
		}
		/**
		 * precodeHtmlToText Функция преобразования html в чистый html или текст
		 * @param  {String} text         исходный текст
		 * @param  {String} allowed_tags разрешенные теги
		 * @return {String}              результирующий текст
		 */
		static precodeHtmlToText(text, allowed_tags = ""){
			// Если текст существует
			if(Anyks.isString(text) && text.length){
				// Получаем объект html для работы
				const html = Anyks.html();
				// Функция очистки html разметки
				const clearHtml = text => {
					// Возвращаем результат
					return clearTags(
						Anyks.strip_tags(
							text
							.replace(/\(\)/ig, "")
							.replace(/\&\#/ig, "")
							.replace(/\s\;/ig, ";")
							.replace(/^\*/ig, "")
							.replace(/\,{1,}/ig, ",")
							.replace(/\<b\>/ig, "<strong>")
							.replace(/\<\/b\>/ig, "</strong>")
							.replace(/\<i\>/ig, "<em>")
							.replace(/\<\/i\>/ig, "</em>")
							.replace(/\<ul\>/ig, "<p>")
							.replace(/\<\/ul\>/ig, "</p>")
							.replace(/\<li\>/ig, "")
							.replace(/\<\/li\>/ig, "<br>")
							.replace(/<br\s*\/?>/g, "<br>")
							.replace(/\<dl\>/ig, "")
							.replace(/\<\/dl\>/ig, "")
							.replace(/\<dt\>/ig, "<strong><em>")
							.replace(/\<\/dt\>/ig, "</em></strong>")
							.replace(/\<br\>\s*\<\/p\>/ig, "</p>")
							.replace(/\<p\>\s*\<br\>\s*\<\/p\>/ig, "")
							.replace(/\<p\>\s*\<\/p\>/ig, "")
							.replace(/\<p\>\s*\<p\>/ig, "<p>")
							.replace(/\<\/p\>\s*\<\/p\>/ig, "</p>")
							.replace(/\<p\>\s*[\.]+\s*\<\/p\>/ig, "")
							.replace(/\<p\>\s*…\s*\<\/p\>/ig, "")
							.replace(/\(\d+\)/, "")
							.replace(/\[\d+\]/, "")
							.replace(/https?\:\/\/[\w\.]+\.[\w]+[А-Яа-яЁё\w\d\?\&\#\=\+\%\;\@\!\^\*\(\)\_\-\+\/]*(\s$)*/ig, ""),
							allowed_tags
						)
					).trim();
				};
				// Зменяем до тех пор пока в тексте их не останется
				while(/\&[\d\#]+\;/ig.test(text)){
					// Извлекаем мнемоники из текста
					let htmls = /\&[\w\d\#]+\;/ig.exec(text), arr;
					// Если массив существует
					if(Anyks.isArray(htmls)){
						// Результирующий текст
						let result = htmls[0];
						// Исправляем текст
						while(/\;(\d+)\;/ig.test(result)){
							// Извлекаем испорченные символы
							arr = /\;(\d+)\;/ig.exec(result);
							// Если массив найден
							if(Anyks.isArray(arr) && (arr.length === 2)){
								// Исправляем текст
								result = result.replace(arr[0], ";&#" + arr[1] + ";");
							}
						}
						// Исправляем текст
						while(/\&[\#\d\w]+\;/ig.test(result)){
							// Разбиваем мнемоники на составляющие
							arr = /\&[\#\d\w]+\;$/ig.exec(result);
							// Если массив существует
							if(Anyks.isArray(arr)){
								// Перекодирум текст
								result = result.replace(arr[0], html.decode(arr[0]));
							}
						}
						// Исправляем текст
						text = text.replace(htmls[0], result);
					}
				}
				// Возвращаем результат
				return clearHtml(clearHtml(text));
			// Выводим пустой текст
			} else return "";
		}
		/* ДИНАМИЧЕСКИЕ МЕТОДЫ */
		/**
		 * parseInt Функция приведения числа к типу Int
		 * @param  {String} строковое значение числа
		 * @return {Number} полученное число
		 */
		parseInt(val){
			// Выполняем обработку
			return Anyks.parseInt(val);
		}
		/**
		 * isFunction Проверка существование функции
		 * @param  {Function}  func функция для проверки
		 * @return {Boolean}        результат проверки
		 */
		isFunction(func){
			// Выполняем обработку
			return Anyks.isFunction(func);
		}
		/**
		 * isString Проверка существование строки
		 * @param  {String}   str функция для проверки
		 * @return {Boolean}      результат проверки
		 */
		isString(str){
			// Выполняем обработку
			return Anyks.isString(str);
		}
		/**
		 * isSymbol Проверка существование symbol
		 * @param  {String}   sym символ для проверки
		 * @return {Boolean}      результат проверки
		 */
		isSymbol(sym){
			// Выполняем обработку
			return Anyks.isSymbol(sym);
		}
		/**
		 * isNumber Проверка на то число это или нет
		 * @param  {Number}  number число для проверки
		 * @return {Boolean}        результат проверки
		 */
		isNumber(number){
			// Выполняем обработку
			return Anyks.isNumber(number);
		}
		/**
		 * isBoolean Проверка на булевое значение
		 * @param  {Boolean}  bool булевое значение для проверки
		 * @return {Boolean}       результат проверки
		 */
		isBoolean(bool){
			// Выполняем обработку
			return Anyks.isBoolean(bool);
		}
		/**
		 * isObject Проверка на то объект это или нет
		 * @param  {Object}  object число для проверки
		 * @return {Boolean}        результат проверки
		 */
		isObject(object){
			// Выполняем обработку
			return Anyks.isObject(object);
		}
		/**
		 * isArray Функция определения является ли элемент массивом
		 * @param  {Array}  arr  массив для проверки
		 * @return {Boolean}     результат проверки
		 */
		isArray(arr){
			// Выполняем обработку
			return Anyks.isArray(arr);
		}
		/**
		 * isset Функция возвращает true если данные не пустые
		 * @param  {Variant} data абстрактная величина для проверки
		 * @return {Boolean}      результат проверки
		 */
		isset(data){
			// Выполняем обработку
			return Anyks.isset(data);
		}
		/**
		 * inArray Функция поиска в массиве указанного значения
		 * @param  {Variant} elem элемент для поиска в массиве
		 * @param  {Array}   arr  массив в котором осуществляется поиск
		 * @param  {Number}  i    индекс массива с которого нужно начать
		 * @return {Number}       индекс массива в котором найден элемент
		 */
		inArray(elem, arr, i){
			// Выполняем обработку
			return Anyks.inArray(elem, arr, i);
		}
		/**
		 * each Рекурсивная функция перебора массива с функцией обратного вызова
		 * @param  {Array}    data     массив для обхода
		 * @param  {Function} each     функция обратного вызова которая срабатывает на каждом элементе
		 * @param  {Function} callback функция обратного вызова при завершении обхода
		 */
		each(data, each, callback){
			// Выполняем обработку
			return Anyks.each(data, each, callback);
		}
		/**
		 * build_ident Функция генерирования уникального идентификатора
		 * @return {String} уникальный идентификатор
		 */
		build_ident(){
			// Выполняем обработку
			return Anyks.build_ident();
		}
		/**
		 * floorN Функция округления до определенного количества знаков после запятой
		 * @param  {Number} x число для округления
		 * @param  {Number} n количество знаков после запятой
		 * @return {Number}   округлённое число
		 */
		floorN(x, n){
			// Выполняем обработку
			return Anyks.floorN(x, n);
		}
		/**
		 * fnShowProps Функция поиска параметра в объекте json
		 * @param  {Object} obj     Объект в котором нужно найти параметр
		 * @param  {String} objName Параметр объекта
		 * @return {Variant}        найденный результат
		 */
		fnShowProps(obj, objName){
			// Выполняем обработку
			return Anyks.fnShowProps(obj, objName);
		}
		/**
		 * returnObject Функция извлекает ссылки на параметры объекта игнорируя указанный
		 * @param  {Object} obj    объект в котором нужно получить данные
		 * @param  {String} ignore параметр который нужно проигнорировать
		 * @return {Object}        новый созданный объект
		 */
		returnObject(obj, ignore){
			// Выполняем обработку
			return Anyks.returnObject(obj, ignore);
		}
		/**
		 * cloneObject Функция клонирования объектов
		 * @param  {Object} obj  объект для клонирования
		 * @param  {String} type тип клонирования (string or null)
		 * @return {Object}      результирующий объект
		 */
		cloneObject(obj, type){
			// Выполняем обработку
			return Anyks.cloneObject(obj, type);
		}
		/**
		 * equal Функция сравнения двух объектов
		 * @param  {Object} firstObject  первый объект для сравнения
		 * @param  {Object} secondObject второй объект для сравнения
		 * @return {Boolean}             результат сравнения
		 */
		equal(firstObject, secondObject){
			// Выполняем обработку
			return Anyks.equal(firstObject, secondObject);
		}
		/**
		 * msecToTime Функция перевода милисекунд в дни
		 * @param  {Number} b timestamp для перевода в дни
		 * @return {String}   строковое значение даты
		 */
		msecToTime(b){
			// Выполняем обработку
			return Anyks.msecToTime(b);
		}
		/**
		 * formatSize Функция получения размера из числа
		 * @param  {Number} length Размер числа в байтах
		 * @param  {Array}  type   массив обозначений размеров например: ["б", "Кб", "Мб", "Гб", "Тб", "Пб"]
		 * @return {String}        строка с указанным размером
		 */
		formatSize(length, type){
			// Выполняем обработку
			return Anyks.formatSize(length, type);
		}
		/**
		 * random Функция генерации случайного значения
		 * @param  {Number} min  минимальное значение числа
		 * @param  {Number} max  максимальное значение числа
		 * @return {Number}      случайное число в указанном диапазоне
		 */
		random(min, max){
			// Выполняем обработку
			return Anyks.random(min, max);
		}
		// Функции сортировки
		/**
		 * invertArray Перевернуть массив с задом на перед
		 * @param  {Array} arr исходный массив
		 * @return {Array}     результирующий массив
		 */
		invertArray(arr){
			// Выполняем обработку
			return Anyks.invertArray(arr);
		}
		/*
		*	var arr = [1,2,3,4,5,6,7,8,9,10];
		*	arr.sort(ax.sIncrease); // Вернет [1,2,3,4,5,6,7,8,9,10]
		*	arr.sort(ax.sDecrease); // Вернет [10,9,8,7,6,5,4,3,2,1]
		*	arr.sort(ax.sRand); // Вернет случайно отсортированный массив, например [1,10,3,4,8,6,9,2,7,5]
		*/
		/**
		 * sIncrease По возрастанию
		 * @param  {Number} i  предыдущее значение массива
		 * @param  {Number} ii текущее значение массива
		 * @return {Number}    результат
		 */
		sIncrease(i, ii){
			// Выполняем обработку
			return Anyks.sIncrease(i, ii);
		}
		/**
		 * sDecrease По убыванию
		 * @param  {Number} i  предыдущее значение массива
		 * @param  {Number} ii текущее значение массива
		 * @return {Number}    результат
		 */
		sDecrease(i, ii){
			// Выполняем обработку
			return Anyks.sDecrease(i, ii);
		}
		/**
		 * sRand Случайная
		 */
		sRand(){
			// Выполняем обработку
			return Anyks.sRand();
		}
		/**
		 * getRandomInt Функция генерации случайного значения от min до max
		 * @param  {Number} min минимальное значение
		 * @param  {Number} max максимальное значение
		 * @return {Number}     случайное значение в указанном диапазоне
		 */
		getRandomInt(min, max){
			// Выполняем обработку
			return Anyks.getRandomInt(min, max);
		}
		/**
		 * random_number_array Функция перераспределения массива для создания нового массива без повторений старого
		 * @param  {Array} data массив для перераспределения
		 * @return {Array}      перераспределенный массив
		 */
		random_number_array(data){
			// Выполняем обработку
			return Anyks.random_number_array(data);
		}
		/**
		 * getArraySlice Функция прокрутки превью изображений
		 * @param  {Array}  a массив данных
		 * @param  {Number} i смещение
		 * @param  {Number} n размер нового массива
		 * @param  {Number} k количество элементов для выдачи
		 * @return {Array}    результирующий массив
		 */
		getArraySlice(a, i, n, k){
			// Выполняем обработку
			return Anyks.getArraySlice(a, i, n, k);
		}
		/**
		 * each_object Функция перехода по объекту данных
		 * @param  {Object}   object   объект для обхода
		 * @param  {Function} callback функция обратного вызова при каждой итерации
		 * @return {Object}            объект по завершению обхода
		 */
		each_object(object, callback){
			// Выполняем обработку
			return Anyks.each_object(object, callback);
		}
		/**
		 * html Функция работа с html мнемониками
		 * @return {Object} результирующий объект
		 */
		html(){
			// Выполняем обработку
			return Anyks.html();
		}
		/**
		 * htmlspecialchars_encode Функция кодирования html текста
		 * @param  {String}   string  строка текста для кодирования
		 * @param  {Boolean}  reverse нужно ли отменить перевод
		 * @return {String}           результирующая строка
		 */
		htmlspecialchars_encode(string, reverse){
			// Выполняем обработку
			return Anyks.htmlspecialchars_encode(string, reverse);
		}
		/**
		 * htmlspecialchars_decode Функция декодирования html текста
		 * @param  {String}   string  строка текста для кодирования
		 * @param  {Boolean}  reverse нужно ли отменить перевод
		 * @return {String}           результирующая строка
		 */
		htmlspecialchars_decode(string, reverse){
			// Выполняем обработку
			return Anyks.htmlspecialchars_decode(string, reverse);
		}
		/**
		 * strip_tags Функция вырезания html тегов из текста
		 * @param  {String} str          исходная строка
		 * @param  {String} allowed_tags разрешенные теги
		 * @param  {String} separator    разделитель если необходим
		 * @return {String}              результирующая строка
		 */
		strip_tags(str, allowed_tags, separator){
			// Выполняем обработку
			return Anyks.strip_tags(str, allowed_tags, separator);
		}
		/**
		 * clearTags Функция очистки тегов
		 * @param  {String} text текст с html тегами
		 * @return {String}      очищенный текст
		 */
		clearTags(text){
			// Выполняем обработку
			return Anyks.clearTags(text);
		}
		/**
		 * precodeHtmlToText Функция преобразования html в чистый html или текст
		 * @param  {String} text         исходный текст
		 * @param  {String} allowed_tags разрешенные теги
		 * @return {String}              результирующий текст
		 */
		precodeHtmlToText(text, allowed_tags){
			// Выполняем обработку
			return Anyks.precodeHtmlToText(text, allowed_tags);
		}
		// Конструктор класса
		constructor(){
			// Название класса
			const nameClass = "anyks";
			// Устанавливаем название класса
			this.name = nameClass;
			/* Изменяем прототипы основных типов данных НАЧАЛО */
			/**
			 * method Устанавливаем автоматическое присвоение методов
			 * @param  {String}   name название функции
			 * @param  {Function} func функция обратного вызова
			 * @return {Object}        объект прототипа
			 */
			Function.prototype.method = function(name, func){
				// Изменяем название метода
				name = nameClass + "_" + name;
				// Если метод не существует тогда создаем его
				if(!this.prototype[name]){
					this.prototype[name] = func;
					return this;
				}
			};
			/**
			 * Date.toLocaleString Расширяем формат даты и времени
			 */
			Date.method("toLocaleString", function(){
				// Выводим результат
				return Anyks.addZerro(this.getDate()) + "."
				+ Anyks.addZerro(this.getMonth() + 1) + "."
				+ Anyks.addZerro(this.getFullYear())
				+ " " + Anyks.addZerro(this.getHours()) + ":"
				+ Anyks.addZerro(this.getMinutes()) + ":"
				+ Anyks.addZerro(this.getSeconds());
			});
			/**
			 * Date.toLocaleDateString Расширяем формат даты
			 */
			Date.method("toLocaleDateString", function(){
				return Anyks.addZerro(this.getDate()) + "."
				+ Anyks.addZerro(this.getMonth() + 1) + "."
				+ Anyks.addZerro(this.getFullYear());
			});
			/**
			 * Date.toLocaleTimeString Расширяем формат времени
			 */
			Date.method("toLocaleTimeString", function(){
				return Anyks.addZerro(this.getHours()) + ":"
				+ Anyks.addZerro(this.getMinutes()) + ":"
				+ Anyks.addZerro(this.getSeconds());
			});
			/**
			 * String.toInt Создаем метод для преобразования в тип Integer
			 */
			String.method("toInt", function(){
				return this >> 0;
			});
			/**
			 * String.clearColor Создаем метод для очистки текста от кодов цветов консоли
			 */
			String.method("clearColor", function(flag = true){
				return (flag ? this.replace(/\x1B\[\d+m/ig, "") : this);
			});
			/**
			 * String.trim Создаем метот trim
			 */
			String.method("trim", function(){
				return this
				.replace(/^\s+|\s+$/g, "")
				.replace(/[\u200B\s]{1,}/ig, " ");
			});
			/**
			 * String.removeEnter Создаем метод удаления Enter
			 */
			String.method("removeEnter", function(){
				return this.replace(/[\r\n]/g, " ").anyks_trim();
			});
			/**
			 * String.fixAmp Создаем метод парсинга ссылок сайта (заменяет &amp; на &)
			 */
			String.method("fixAmp", function(){
				return this.replace(/&amp;/g, "&");
			});
			/**
			 * String.ucwords Создаем метод перевода первого символа в верхний регистр а остальных символов в нижний регистр
			 */
			String.method("ucwords", function(){
				// Возвращаем текущую строку
				return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
			});
			/**
			 * String.upwords Создаем метод перевода только первого символа в верхний регистр
			 */
			String.method("upwords", function(){
				// Возвращаем текущую строку
				return this.charAt(0).toUpperCase() + this.substr(1);
			});
			/**
			 * String.rqomma Заменить в конце запятую на точку
			 */
			String.method("rqomma", function(){
				// Возвращаем текущую строку
				return this.replace(/\,$/i, ".");
			});
			/**
			 * String.checkCode Метод проверки на существование латинских или кирилических символов
			 */
			String.method("checkCode", function(flag){
				// Карта символов для латиницы
				const mapLat = {
					"a": true,
					"b": true,
					"c": true,
					"d": true,
					"e": true,
					"f": true,
					"g": true,
					"h": true,
					"i": true,
					"j": true,
					"k": true,
					"l": true,
					"m": true,
					"n": true,
					"o": true,
					"p": true,
					"q": true,
					"r": true,
					"s": true,
					"t": true,
					"u": true,
					"v": true,
					"w": true,
					"x": true,
					"y": true,
					"z": true
				};
				// Карта символов кирилицы
				const mapCyr = {
					"а": true,
					"б": true,
					"в": true,
					"г": true,
					"д": true,
					"е": true,
					"ё": true,
					"ж": true,
					"з": true,
					"и": true,
					"й": true,
					"к": true,
					"л": true,
					"м": true,
					"н": true,
					"о": true,
					"п": true,
					"р": true,
					"с": true,
					"т": true,
					"у": true,
					"ф": true,
					"х": true,
					"ц": true,
					"ч": true,
					"ш": true,
					"щ": true,
					"ъ": true,
					"ы": true,
					"ь": true,
					"э": true,
					"ю": true,
					"я": true
				};
				// Определяем карту
				const map = (flag ? mapCyr : mapLat);
				// Проверяем существует ли данный символ
				for(let i = 0; i < this.length; i++) if(map[this[i].toLowerCase()]) return true;
				// Выходим
				return false;
			});
			/**
			 * String.checkEmail Проверяем на правильность e-mail
			 */
			String.method("checkEmail", function(){
				// Проверяем на e-mail
				return /^(|(([A-Za-z0-9]+_+)|([A-Za-z0-9]+\-+)|([A-Za-z0-9]+\.+)|([A-Za-z0-9]+\++))*[A-Za-z0-9]+@((\w+\-+)|(\w+\.))*\w{1,63}\.[a-zA-Z]{2,6})$/i.test(this);
			});
			/**
			 * String.translit Создаем метод перевода текста в транслит
			 */
			String.method("translit", function(){
				// Карта транслита
				const map = {
					"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
					"ё": "e", "ж": "je", "з": "z", "и": "i", "й": "ik", "к": "k",
					"л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
					"с": "s", "т": "t", "у": "y", "ф": "f", "х": "h", "ц": "c",
					"ч": "che", "ш": "she", "щ": "she", "ъ": "tm", "ы": "yae", "ь": "mm",
					"э": "ae", "ю": "u", "я": "ya"
				};
				// Выводим результат
				return this.toLowerCase().replace(/[а-яё]/g, x => {return map[x] || x;});
			});
			/**
			 * String.matfilter Фильтр мата
			 */
			String.method("matfilter", function(){
				return this.replace(/\w{0,5}[хx]([хx\s\!@#\$%\^&*+-\|\/]{0,6})[уy]([уy\s\!@#\$%\^&*+-\|\/]{0,6})[Єiлeеюий€]\w{0,7}|\w{0,6}[пp]([пp\s\!@#\$%\^&*+-\|\/]{0,6})[iие]([iие\s\!@#\$%\^&*+-\|\/]{0,6})[3зс]([3зс\s\!@#\$%\^&*+-\|\/]{0,6})[дd]\w{0,10}|[сcs][уy]([уy\!@#\$%\^&*+-\|\/]{0,6})[4чkк]\w{1,3}|\w{0,4}[bб]([bб\s\!@#\$%\^&*+-\|\/]{0,6})[lл]([lл\s\!@#\$%\^&*+-\|\/]{0,6})[y€]\w{0,10}|\w{0,8}[еЄ][bб][лске@eыиаa][наи@йвл]\w{0,8}|\w{0,4}[еe]([еe\s\!@#\$%\^&*+-\|\/]{0,6})[бb]([бb\s\!@#\$%\^&*+-\|\/]{0,6})[uу]([uу\s\!@#\$%\^&*+-\|\/]{0,6})[н4ч]\w{0,4}|\w{0,4}[еeЄ]([еeЄ\s\!@#\$%\^&*+-\|\/]{0,6})[бb]([бb\s\!@#\$%\^&*+-\|\/]{0,6})[нn]([нn\s\!@#\$%\^&*+-\|\/]{0,6})[уy]\w{0,4}|\w{0,4}[еe]([еe\s\!@#\$%\^&*+-\|\/]{0,6})[бb]([бb\s\!@#\$%\^&*+-\|\/]{0,6})[оoаa@]([оoаa@\s\!@#\$%\^&*+-\|\/]{0,6})[тnнt]\w{0,4}|\w{0,10}[Є]([Є\!@#\$%\^&*+-\|\/]{0,6})[б]\w{0,6}|\w{0,4}[pп]([pп\s\!@#\$%\^&*+-\|\/]{0,6})[иeеi]([иeеi\s\!@#\$%\^&*+-\|\/]{0,6})[дd]([дd\s\!@#\$%\^&*+-\|\/]{0,6})[oоаa@еeиi]([oоаa@еeиi\s\!@#\$%\^&*+-\|\/]{0,6})[рr]\w{0,12}/i, "***");
			});
			/**
			 * String.textToEmoji Преобразуем текст в Эмодзи
			 */
			String.method("textToEmoji", function(){
				// Выводим смайлы в Emoji виде
				return this
				// Заменяем на улыбку
				.replace(/:\-\)/g, "😊")
				.replace(/:\)/g, "😊")
				.replace(/:\=\)/g, "😊")
				// Подмигнуть
				.replace(/;\-\)/g, "😉")
				.replace(/;\)/g, "😉")
				.replace(/;\=\)/g, "😉")
				// Грусть
				.replace(/:\-\(/g, "😒")
				.replace(/:\(/g, "😒")
				.replace(/:\=\(/g, "😒")
				// Язык
				.replace(/:\-P/g, "😋")
				.replace(/:P/g, "😋")
				.replace(/:\=P/g, "😋")
				// Смех
				.replace(/:\-D/g, "😃")
				.replace(/:D/g, "😃")
				.replace(/:\=D/g, "😃")
				// Удивление
				.replace(/:\=O/g, "😯")
				.replace(/:O/g, "😯")
				.replace(/\=O/g, "😯")
				.replace(/\O\_o/g, "😯")
				// Крутой
				.replace(/8\-\)/g, "😎")
				.replace(/8\)/g, "😎")
				.replace(/8\=\)/g, "😎")
				// Больной
				.replace(/:\-\!/g, "😣")
				.replace(/:\!/g, "😣")
				.replace(/:\=\!/g, "😣")
				// Злой
				.replace(/\]:\-\>/g, "😡")
				.replace(/\]:\>/g, "😡")
				.replace(/\]:\=\>/g, "😡")
				// Стесняется
				.replace(/:\-\[/g, "😳")
				.replace(/:\[/g, "😳")
				.replace(/:\=\[/g, "😳")
				// Ангел
				.replace(/O:\-\)/g, "😇")
				.replace(/O:\)/g, "😇")
				.replace(/O:\=\)/g, "😇")
				// Плачет
				.replace(/:\'\-\(/g, "😢")
				.replace(/:\'\(/g, "😢")
				.replace(/:\'\=\(/g, "😢")
				// Поцелуй
				.replace(/:\-\*/g, "😚")
				.replace(/:\*/g, "😚")
				.replace(/:\=\*/g, "😚")
				// Обида
				.replace(/:\-\//g, "😕")
				.replace(/:\//g, "😕")
				.replace(/:\=\//g, "😕")
				// Достали
				.replace(/\%\-\)/g, "😨")
				.replace(/\%\)/g, "😨")
				.replace(/\%\=\)/g, "😨")
				// Не понятно
				.replace(/:\-\$/g, "😵")
				.replace(/:\$/g, "😵")
				.replace(/:\=\$/g, "😵")
				// Роза
				.replace(/@}->--/g, "🌺")
				// Насмешка
				.replace(/\*JOKINGLY\*/g, "😏")
				// Задница
				.replace(/\*BB\*/g, "❤")
				// Дерется
				.replace(/\>:o/g, "😠")
				// Счастлив
				.replace(/\*HAPPY\*/g, "😌")
				// Спит
				.replace(/\*LAZY\*/g, "😴")
				// Вопрос
				.replace(/\*\?\*/g, "😯")
				// Согласие
				.replace(/\*YES\*/g, "😍");
			});
			/**
			 * String.emojiToText Преобразуем смайлы в текст
			 */
			String.method("emojiToText", function(){
				// Выводим смайлы в текстовом виде
				return this
				// Заменяем на улыбку
				.replace(/😊/g, ":-)")
				// Подмигнуть
				.replace(/😉/g, ";-)")
				// Грусть
				.replace(/😒/g, ":-(")
				// Язык
				.replace(/😋/g, ":-P")
				// Смех
				.replace(/😃/g, ":-D")
				// Удивление
				.replace(/😯/g, "O_o")
				// Крутой
				.replace(/😎/g, "8-)")
				// Больной
				.replace(/😣/g, ":-!")
				// Злой
				.replace(/😡/g, "]:->")
				// Стесняется
				.replace(/😳/g, ":-[")
				// Ангел
				.replace(/😇/g, "O:-)")
				// Плачет
				.replace(/😢/g, ":'-(")
				// Поцелуй
				.replace(/😚/g, ":-*")
				// Обида
				.replace(/😕/g, ":-/")
				// Достали
				.replace(/😨/g, "%-)")
				// Не понятно
				.replace(/😵/g, ":-$")
				// Роза
				.replace(/🌺/g, "@}->--")
				// Насмешка
				.replace(/😏/g, "*JOKINGLY*")
				// Задница
				.replace(/❤/g, "*BB*")
				// Дерется
				.replace(/😠/g, ">:o")
				// Счастлив
				.replace(/😌/g, "*HAPPY*")
				// Спит
				.replace(/😴/g, "*LAZY*")
				// Вопрос
				.replace(/😯/g, "*?*")
				// Согласие
				.replace(/😍/g, "*YES*");
			});
			/**
			 * String.clearHtml Функция очистки html тегов
			 */
			String.method("clearHtml", function(){
				// Удаляем html теги
				return this.replace(/\<\/?\w+\>/ig, "");
			});
			/**
			 * Array.toObjString Функция преобразования объектов массива в строки
			 */
			Array.method("toObjString", function(){
				// Переконвертируем объекты в строки
				return this.map(function(name){
					// Выводим результат
					return (Anyks.isObject(name) ? decodeURI(JSON.stringify(name)) : name);
				});
			});
			/**
			 * Array.toSmiles Выполняем перевод смайлов по указанной функции для массива, пример: arr.toSmiles("textToEmoji");
			 */
			Array.method("toSmiles", function(func){
				if(Anyks.isString(func) && func.length){
					// Переконвертируем смайлы
					return this.map(function(name){
						// Выводим переконвертированный смайлик
						if(Anyks.isString(name)) return eval("name.anyks_" + func)();
						// Возвращаем так как оно есть
						return name;
					});
				}
				// Выводим так как оно есть
				return this;
			});
			/**
			 * Array.toString Добавляем в массивы метод массового приведения к типу String
			 */
			Array.method("toString", function(){
				// Переконвертируем в Integer
				return this.map(function(name){
					// Выводим переконвертированные данные
					if(Anyks.isNumber(name)) return (name.toString()).replace(/A\s+|\s+$/g, "");
					// Возвращаем так как оно есть
					return name;
				});
			});
			/**
			 * Array.sortUnique Добавляем в массивы метод удаления дубликатов
			 */
			Array.method("sortUnique", function(){
				const newArr = this
				.sort(function(a, b){
					if(!Anyks.isObject(a)
					&& !Anyks.isObject(b)
					&& (a === b)) return 0;
					else if(JSON.stringify(a) === JSON.stringify(b)) return 0;
					if(typeof(a) === typeof(b)) return (a < b ? -1 : 1);
					return (typeof(a) < typeof(b) ? -1 : 1);
				}).reduce(function(arr, el){
					if(!arr.length || arr.length
					&& !Anyks.isObject(arr[arr.length - 1])
					&& !Anyks.isObject(el)
					&& (arr[arr.length - 1] !== el)) arr.push(el);
					else if(!arr.length || arr.length
					&& (JSON.stringify(arr[arr.length - 1]) !== JSON.stringify(el))) arr.push(el);
					return arr;
				}, []);
				return newArr;
			});
			/**
			 * Array.unique Добавляем в массивы метод удаления дубликатов
			 */
			Array.method("unique", function(){
				// Новый результирующий массив
				const tmpObj = {};
				// Выводим отфильтрованный массив
				return this.filter(function(number){
					// Флаг проверки на существование элемента
					let flag = !tmpObj[number];
					// Добавляем в объект текущее число
					tmpObj[number] = true;
					// Выводим результат
					return flag;
				});
			});
			/**
			 * Array.uniqueValObject Добавляем в массивы метод удаления дубликатов объектов по их ключам
			 */
			Array.method("uniqueValObject", function(key){
				const repeated	= [];
				const items		= {};
				Anyks.each(this, function(i, val){
					if(!ax.isset(items[val[key]])){
						repeated.push(val);
						items[val[key]] = true;
					} else items[val[key]] = false;
				});
				return repeated;
			});
			/**
			 * Array.removeToVal Добавляем в массивы метод удаления пункта по его значению
			 */
			Array.method("removeToVal", function(val){
				// Получаем индекс пункта в общем массиве
				const index = Anyks.inArray(val, this);
				// Если индекс найден
				if(index > -1) this.splice(index, 1);
				// Возвращаем результат
				return this;
			});
			/* Расширяем массивы для нормальной сортировки НАЧАЛО */
			Array.method("_parseInt", function(field){
				// Переконвертируем в Integer
				this.map(function(name){
					// Выполняем умножение
					name[field] = name[field] * 1;
					// Возвращаем так как оно есть
					return name;
				});
				// Выводим false
				return false;
			});
			Array.method("_sortPrep", function(field){
				if(!this.maximum){
					this.maximum = this[0][field];
					let i = this.length;
					while(i--){
						if(this.maximum < this[i][field]) this.maximum = this[i][field];
					}
				}
				if(this.maximum){
					const fill = [];
					const length = this.maximum.toString().length;
					let i = length;
					let zs = "";
					while(i--){
						fill.push(zs);
						zs += "0";
					}
					for(let i = 0; i < this.length; i++){
						this[i][field] = (
							this[i][field].toString().length < (length ? fill[
								length - this[i][field].toString().length
							] : "")
						) + this[i][field];
					}
				}
				// Возвращаем результат
				return this;
			});
			Array.method("_sortIntAsc", function(field){
				this.anyks__sortPrep(field);
				const saveO					= Object.prototype.toString;
				const saveA					= Array.prototype.toString;
				Object.prototype.toString	= function(){return this[field]};
				Array.prototype.toString	= function(){return this[field]};
				this.sort();
				Array.prototype.toString	= saveA;
				Object.prototype.toString	= saveO;
				return this;
			});
			Array.method("_sortIntDesc", function(field){
				this.anyks__sortPrep(field);
				const saveO					= Object.prototype.toString;
				const saveA					= Array.prototype.toString;
				Object.prototype.toString	= function(){return this[field]};
				Array.prototype.toString	= function(){return this[field]};
				this.sort();
				this.reverse();
				Array.prototype.toString	= saveA;
				Object.prototype.toString	= saveO;
				return this;
			});
			/* Функция сортирует массив объектов по названию поля например
			* arr = [{name: "name1", param: "param1"},{name: "name0", param: "param0"}]
			* arr.anyks_sortAsc("name");
			*/
			Array.method("sortAsc", function(field){
				const saveO					= Object.prototype.toString;
				const saveA					= Array.prototype.toString;
				Object.prototype.toString	= function(){return this[field]};
				Array.prototype.toString	= function(){return this[field]};
				this.sort();
				Array.prototype.toString	= saveA;
				Object.prototype.toString	= saveO;
				return this;
			});
			/**
			 * Array.sortDesc Тоже самое что и sortAsc но в обратном порядке
			 */
			Array.method("sortDesc", function(field){
				const saveO					= Object.prototype.toString;
				const saveA					= Array.prototype.toString;
				Object.prototype.toString	= function(){return this[field]};
				Array.prototype.toString	= function(){return this[field]};
				this.sort();
				this.reverse();
				Array.prototype.toString	= saveA;
				Object.prototype.toString	= saveO;
				return false;
			});
			/**
			 * Array.sortIntAsc Сортируем по возрастания тип integer
			 */
			Array.method("sortIntAsc", function(field){
				this.anyks__sortIntAsc(field);
				this.anyks__parseInt(field);
				return false;
			});
			/**
			 * Array.sortIntDesc Сортируем по убыванию тип integer
			 */
			Array.method("sortIntDesc", function(field){
				this.anyks__sortIntDesc(field);
				this.anyks__parseInt(field);
				return false;
			});
			/* Расширяем массивы для нормальной сортировки КОНЕЦ */
			/* Изменяем прототипы основных типов данных КОНЕЦ */
 		}
	}
	// Создаем модуль для Node.js
	module.exports = new Anyks();
})();