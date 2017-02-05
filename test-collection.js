const _ = require('lodash');


var data = {
    "items": [
        {
            "field": "Story Points",
            "fieldtype": "custom",
            "from": null,
            "fromString": "0",
            "to": null,
            "toString": "1"
        }
    ]
};
var status =  null;
status = _.findWhere(_.get(data, 'changelog.items', { 'field': 'status'}));
console.log(status.fromString);