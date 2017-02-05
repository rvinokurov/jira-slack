const express = require('express');
const router = express.Router();
const util = require('util');
const _ = require('lodash');
const request = require('request');

const url = 'slack hook';
const jiraUrl = 'http://[jira-domain]/browse'; //prefix for url tasks

var sendSlackRequest = function(attachment, callback) {
    if(!callback) {
        callback = function() {};
    }
    data = {
        "attachments": [attachment]
    };
    request.post({
        url: url,
        form: {payload: JSON.stringify(data)}
    }, function (error, httpResponse, body) {
        if(error) {
            console.log(error);
            return callback(error);
        }
        callback(null);
    });
};



/* GET home page. */
router.get('/', function (req, res, next) {
    res.send('Jira -> Slack is running');
});


var sendCreateMessage = function(issue, callback) {
    var pretext = _.get(issue, 'user.displayName') + ' created '
        +  _.get(issue, 'issue.fields.issuetype.name') +
        ' <' + jiraUrl + _.get(issue, 'issue.key') + '|' +  _.get(issue, 'issue.key') + '>';
    var data = {
        "fallback": '',
        "color": "#good",
        pretext: pretext,
        "fields": [
            {
                "title": "Summary",
                "value": _.get(issue,  'issue.fields.summary'),
                "short": false
            },
            {
                "title": "Assignee",
                "value": _.get(issue,  'issue.fields.assignee.displayName'),
                "short": false
            }

        ]
    };
    sendSlackRequest(data, callback);
};

var sendUpdateMessage = function(issue, callback) {
    if(issue.comment) {
        sendNewCommentMessage(issue, callback)
    } else if (issue.changelog) {
        sendStatusChangeMessage(issue);
        callback();
    } else {
        callback();
    }
};


var sendNewCommentMessage = function(issue, callback) {
    var pretext = _.get(issue, 'comment.author.displayName') + ' added comment to '
        +  _.get(issue, 'issue.fields.issuetype.name') +
        ' <' + jiraUrl + _.get(issue, 'issue.key') + '|' +  _.get(issue, 'issue.key') + '>';
    var data = {
        "fallback": '',
        "color": "#good",
        pretext: pretext,
        text: _.get(issue, 'comment.body'),
        "fields": [
            {
                "title": "Summary",
                "value": _.get(issue,  'issue.fields.summary'),
                "short": false
            }
        ]
    };
    sendSlackRequest(data, callback);
};


var sendStatusChangeMessage = function(issue) {
    var statusChange = _.findWhere(_.get(issue, 'changelog.items'), { 'field': 'status'});
    if(!_.isObject(statusChange)) {
        return;
    }

    var pretext = _.get(issue, 'user.displayName') + ' changed status of  '
        +  _.get(issue, 'issue.fields.issuetype.name') +
        ' <' + jiraUrl + _.get(issue, 'issue.key') + '|' +  _.get(issue, 'issue.key') + '>';
    var data = {
        "fallback": '',
        "color": "#good",
        pretext: pretext,
        "fields": [
            {
                "title": "Summary",
                "value": _.get(issue,  'issue.fields.summary'),
                "short": false
            },
            {
                "title": "Old Status",
                "value": statusChange.fromString,
                "short": false
            },
            {
                "title": "New Status",
                "value": statusChange.toString,
                "short": false
            }
        ]
    };
    sendSlackRequest(data, function() {});


};

router.post('/jira', function (req, res, next) {
    //console.log(util.inspect(req.body, {depth: null, colors: true}));
    //console.log(JSON.stringify(req.body, null, '   '));
    //res.json({status: 'ok'});

    var sendResponse = function() {
        res.json({status: 'ok'});
    };


    if(!req.body.webhookEvent) {
        sendResponse();
    } else if(req.body.webhookEvent === 'jira:issue_created') {
        sendCreateMessage(req.body, sendResponse);
    } else if(req.body.webhookEvent === 'jira:issue_updated') {
        sendUpdateMessage(req.body, sendResponse);
    } else {
        sendResponse();
    }

});





module.exports = router;
