// Устанавливаем строгий режим
"use strict";
// Экранируем код
(function(){
	// Подключаем модуль Mongoose
	const mongo = require('mongoose');
	/**
	 * Класс модели
	 */
	class Model {
		/**
		 * constructor Конструктор класса
		 * @param  {Array} collections массив содержащий колекцию
		 */
		constructor(collection){
			// Основная коллекция
			this.collection = collection;
		}
		// Создаем новую схему
		getData(){
			// Выводим коллекцию
			return new mongo.Schema({
				_id:			String,
				name:			String,
				lat:			String,
				lng:			String,
				code:			String,
				gps:			[Number],
				type:			String,
				okato:			String,
				typeShort:		String,
				contentType:	String,
				zip: {
					type:		Number,
					optional:	true
				},
				regionId: {
					type:	String,
					ref:	'Regions'
				},
				districtId: {
					type:	String,
					ref:	'Districts'
				},
				timezone: {
					type: {
						dstOffset:		Number,
						rawOffset:		Number,
						timeZoneId:		String,
						timeZoneName:	String
					},
					optional: true
				}
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();