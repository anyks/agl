var ApiQuery = require("kladrapi").ApiQuery;

var ret = ApiQuery('57500faf0a69decc7d8b4568', 'foontick',
    // {ContentName: 'Шуя', ContentType: 'city', WithParent: true, ParentId: '3700000000000', ParentType: 'region', Limit: 10},
    // {ContentName: 'И', ContentType: 'region', WithParent: 0, Limit: 10},
    {ContentName: "Ш", ContentType: 'district', ParentType: 'region', ParentId: '3700000000000', WithParent: 1, Limit: 10},
    // {ContentName: 'Комсомольская', ContentType: 'street', WithParent: true, ParentId: '3701900100000', ParentType: 'city', Limit: 10},
    function(err, ret) {
        console.log(err, ret.result);
    }
);

/*
{
	id: '3701900100000',
	name: 'Шуя',
	zip: null,
	type: 'Город',
	typeShort: 'г',
	okato: '24411000000',
	contentType: 'city',
	parents: [{
		id: '3700000000000',
		name: 'Ивановская',
		zip: null,
		type: 'Область',
		typeShort: 'обл',
		okato: '24000000000',
		contentType: 'region'
	}, {
		id: '3701900000000',
		name: 'Шуйский',
		zip: null,
		type: 'Район',
		typeShort: 'р-н',
		okato: '24233000000',
		contentType: 'district'
	}]
}

{
	id: '37019001000010900',
	name: 'Комсомольская',
	zip: 155900,
	type: 'Площадь',
	typeShort: 'пл',
	okato: '24411000000',
	contentType: 'street',
	parents:[{
		id: '3700000000000',
		name: 'Ивановская',
		zip: null,
		type: 'Область',
		typeShort: 'обл',
		okato: '24000000000',
		contentType: 'region'
	}, {
		id: '3701900000000',
		name: 'Шуйский',
		zip: null,
		type: 'Район',
		typeShort: 'р-н',
		okato: '24233000000',
		contentType: 'district'
	}, {
		id: '3701900100000',
		name: 'Шуя',
		zip: null,
		type: 'Город',
		typeShort: 'г',
		okato: '24411000000',
		contentType: 'city'
	}]
}



{ id: '3700000000000',
    name: 'Ивановская',
    zip: null,
    type: 'Область',
    typeShort: 'обл',
    okato: '24000000000',
    contentType: 'region' },




	{
	id: '3800000000000',
	name: 'Иркутская',
	zip: null,
	type: 'Область',
	typeShort: 'обл',
	okato: '25000000000',
	contentType: 'region',
	lat: '57.100294',
	lng: '106.363305',
	gps: [ 106.363305, 57.100294 ]
	}
 */