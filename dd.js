var ApiQuery = require("kladrapi").ApiQuery;

var ret = ApiQuery('57500faf0a69decc7d8b4568', 'foontick',
    {ContentName: 'А', ContentType: 'region', WithParent: 0},
    function(err, ret) {
        console.log(err, ret);
    }
);