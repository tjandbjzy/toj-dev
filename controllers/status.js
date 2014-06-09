var net = require('net');
var querystring = require('querystring');

var config = require('../config').config;
var Util = require('../libs/util');

var Problem = require('../proxy').Problem;
var EventProxy = require('eventproxy');
var User = require('../proxy').User;
var Code = require('../proxy').Code;
var Status = require('../proxy').Status;
var Contest = require('../proxy').Contest;
var Contest_Problem = require('../proxy').Contest_Problem;

/**
 * 查看Status页面
 * Status page
 * Status?pid=&username=&lang=&result=
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */

exports.getByPage = function(req, res, next) {
	var _url = '/Status?';
	var _pid = req.query.pid ? parseInt(req.query.pid) : 0;
	var _lang = req.query.lang ? parseInt(req.query.lang) : 0;
	var _username = req.query.username ? req.query.username : '';
	var _result = req.query.result ? req.query.result : '';
	var _page = req.query.page ? parseInt(req.query.page) : 1;

	var query = {};
	if (_pid) {
		query.pid = _pid;
		_url += 'pid=' + _pid;
	} else  _url += 'pid=';

	if (_username) {
		query.username = _username;
		_url += '&username=' + _username;
	} else  _url += '&username=';

	if (_lang) {
		query.lang = _lang;
		_url += '&lang=' + _lang;
	} else  _url += '&lang=';

	if (_result) {
		query.result = config.digit2result[_result];
		_url += '&result=' + _result;
	} else  _url += '&result=';

	var _total_page;
	var loginUser = '';
	if (req.session.user) loginUser = req.session.user.username;

	var events = ['counts', 'stats'];
	var ep = EventProxy.create(events, function(counts, stats) {
		res.render('Status', {
			title:'Status',
			floginUser: loginUser,
			fstats: stats,
			fcorrlang: config.corrlang,
			fpageID: _page,
			fselected:{
				'lang': _lang,
				'result': config.digit2result[_result],
				'username': _username,
				'pid': _pid,
			},
			furl: _url,
			ftotal_page: _total_page,
		});
	});

	ep.fail(next);

	query.contest_belong = -1;

	Status.getCount(query, ep.done(function(counts) {
		_total_page = Math.ceil(counts / 15);
		if (_total_page == 0) _total_page = 1;

		ep.emit('counts', counts);
	}));

	var options = { limit: config.status_per_page, skip: (_page - 1) * config.status_per_page, sort: {run_ID: -1} };
	Status.getMulti(query, {}, options, ep.done('stats'));
};

/**
 * 查看Statistics页面
 * Statistics page
 * Statisitcs?pid=&lang=
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */

exports.getStatistics = function(req, res, next) {
	var _url = '/Statistics?';
	var _pid = req.query.pid ? parseInt(req.query.pid) : 0;
	var _lang = req.query.lang ? parseInt(req.query.lang) : 0;
	var _page = req.query.page ? parseInt(req.query.page) : 1;

	if (!_pid) {
		req.flash('Invalid Problem!');
		return res.redirect('/Problems');
	}
	var query = { contest_belong: -1, speed: 51 };

	query.pid = _pid;
	_url += 'pid=' + _pid;

	if (_lang) {
		query.lang = _lang;
		_url += '&lang=' + _lang;
	} else  _url += '&lang=';

	var _total_page, _total_num;
	var loginUser = '';
	if (req.session.user) loginUser = req.session.user.username;

	var events = ['counts', 'statistics', 'prob'];
	var ep = EventProxy.create(events, function(counts, statistics, prob) {
		res.render('Statistics', {
			title:'Statistics',
			floginUser: loginUser,
			fprob: prob,
			fstatistics: statistics,
			fcorrlang: config.corrlang,
			fpageID: _page,
			flang: _lang,
			furl: _url,
			ftotal_page: _total_page,
			ftotal_num: _total_num,
		});
	});

	ep.fail(next);

	query.contest_belong = -1;

	Status.getCount(query, ep.done(function(counts) {
		_total_page = Math.ceil(counts / config.statistics_per_page);
		if (_total_page == 0) _total_page = 1;
		_total_num = counts;

		ep.emit('counts', counts);
	}));

	Problem.getOne({pid: _pid}, ep.done('prob'));

	var options = { limit: config.statistics_per_page , skip: (_page - 1) * config.statistics_per_page };
	Status.getMulti(query, {}, options, ep.done('statistics'));
};

exports.get_ce = function(req, res, next) {
	var events = ['stat'];
	var ep = EventProxy.create(events, function(stat) {
		res.render('ShowCEError', {
			title: 'Compilation Information',
			fce_info: stat.ce_info,
		});
	});

	ep.fail(next);

	//var _cid = req.query.cid ? parseInt(req.query.cid) : -1;
	var _runid = req.query.runid ? parseInt(req.query.runid) : -1;
	Status.getOne({ run_ID: _runid }, ep.done('stat'));
};


/**
 * Contest 的 Status
 *
 */

exports.contest_getByPage = function(req, res, next) {
	var _url = '/Contest/Status?';
	var _cid = req.query.cid ? parseInt(req.query.cid) : 0;
	var _nid = parseInt(req.query.pid);
	var _lang = req.query.lang ? parseInt(req.query.lang) : '';
	var _username = req.query.username ? req.query.username : '';
	var _result = req.query.result ? req.query.result : '';
	var _page = req.query.page ? parseInt(req.query.page) : 1;

	var query = {};

	if (!_cid) {
		req.flash('error', 'Invalid Contest!');
		return res.redirect('/Contest/Contests?type=0');
	}

	query.contest_belong = _cid;
	_url += 'cid=' + _cid;

	if (_nid - 1001 >= 0 && _nid - 1001 < config.contest_max_probs) {
		_nid -= 1001;
	} else _nid = -1;

	if (_nid != -1) {
		_url += '&pid=' + (_nid+1001);
	} else  _url += '&pid=';

	if (_username !== '') {
		query.username = _username;
		_url += '&username=' + _username;
	} else  _url += '&username=';

	if (_lang !== '') {
		query.lang = _lang;
		_url += '&lang=' + _lang;
	} else  _url += '&lang=';

	if (_result) {
		query.result = config.digit2result[_result];
		_url += '&result=' + _result;
	} else  _url += '&result=';

	var _total_page;
	var loginUser = '';
	if (req.session.user) loginUser = req.session.user.username;

	var events = ['cont', 'counts', 'stats', 'map'];
	var ep = EventProxy.create(events, function(cont, counts, stats, map) {

		res.render('Contest/Contest_Status', {
			title:'Status',
			floginUser: loginUser,
			fcont: cont,
			fstats: stats,
			fmap: map,
			fcorrlang: config.corrlang,
			fpageID: _page,
			fselected:{
				'lang': _lang,
				'result': config.digit2result[_result],
				'username': _username,
				'pid': _nid+1001,
			},
			furl: _url,
			ftotal_page: _total_page,
		});
	});

	ep.fail(next);

	Contest.getOne({ cid: _cid}, ep.done(function(cont) {
		ep.emit('cont', cont);
		var options = { limit: config.status_per_page, skip: (_page - 1) * config.status_per_page, sort: {run_ID: -1} };
		if (_nid != -1) {
			Contest_Problem.getOne({ cid: _cid, nid: _nid }, function(err, cp) {
				if (!cp) {
					ep.emit('stats', []);
				} else {
					query.pid = cp.pid;
					Status.getMulti(query, {}, options, ep.done('stats'));
				}
			});
		} else {
			Status.getMulti(query, {}, options, ep.done('stats'));
		}
	}));

	Status.getCount(query, ep.done(function(counts) {
		_total_page = Math.ceil(counts / 15);
		if (_total_page == 0) _total_page = 1;

		ep.emit('counts', counts);
	}));
	Contest_Problem.getMulti({ cid: _cid }, {}, {}, function(err, probs) {
		var map = {};
		if (err || !probs) {
			ep.unbind();
			req.flash('error', 'Error, something happeded.');
			return res.redirect('/Contest/Contests?type=0');
		} else {
			probs.forEach(function(prob, index) {
				map[prob.pid] = prob.nid;
				if (index == probs.length - 1) ep.emit('map', map);
			});
		}
	});
};

/**
 * Contest Statistics
 */

exports.contest_getStatistics = function(req, res, next) {
	var _url = '/Contest/Statistics?';
	var _cid = req.query.cid ? parseInt(req.query.cid) : 0;
	var _nid = req.query.pid ? parseInt(req.query.pid) : -1;
	var _lang = req.query.lang ? parseInt(req.query.lang) : 0;
	var _page = req.query.page ? parseInt(req.query.page) : 1;

	if (!_cid) {
		req.flash('Invalid Contest!');
		return res.redirect('/Contest/Contests?type=0');
	}

	if (_nid - 1001 >= 0 && _nid - 1001 < config.contest_max_probs) {
		_nid -= 1001;
	} else _nid = -1;

	if (_nid == -1) {
		req.flash('error', 'Invalid Problem!');
		return res.redirect('/Contest/Contests?type=0');
	}

	var query = { contest_belong: _cid, speed: 51 };

	_url += 'cid=' + _cid + '&pid=' + (_nid+1001);
	//query.pid = _pid;

	if (_lang) {
		query.lang = _lang;
		_url += '&lang=' + _lang;
	} else  _url += '&lang=';

	var _total_page, _total_num;
	var loginUser = '';
	if (req.session.user) loginUser = req.session.user.username;

	var events = ['prob', 'counts', 'statistics'];
	var ep = EventProxy.create(events, function(prob, counts, statistics) {

		res.render('Contest/Contest_Statistics', {
			title:'Statistics',
			floginUser: loginUser,
			fprob: prob,
			fstatistics: statistics,
			fcorrlang: config.corrlang,
			fcid: _cid,
			fnid: _nid,
			fpageID: _page,
			flang: _lang,
			furl: _url,
			ftotal_page: _total_page,
			ftotal_num: _total_num,
		});
	});

	ep.fail(next);

	Contest_Problem.getOne({ cid: _cid, nid: _nid}, ep.done(function(prob) {

		if (!prob) {
			ep.emit('prob', null);
			ep.emit('counts', 0);
			ep.emit('statistics', []);
			return;
		} else {
			query.pid = prob.pid;
			ep.emit('prob', prob);
		}

		Status.getCount(query, ep.done(function(counts) {
			_total_page = Math.ceil(counts / config.statistics_per_page);
			if (_total_page == 0) _total_page = 1;
			_total_num = counts;

			ep.emit('counts', counts);
		}));

		var options = { limit: config.statistics_per_page , skip: (_page - 1) * config.statistics_per_page, sort: {time_used: 1, mem_used: 1} };
		Status.getMulti(query, {}, options, ep.done('statistics'));
	}));

};

exports.getUndone = function(req, res, next) {
	var s_array = req.body['runid'];
	if (!s_array) return res.send({});
	
	var ep = new EventProxy();
	ep.after('getnew', s_array.length, function(list) {
		res.send(list);
	});
	for(var i = 0;i < s_array.length; ++i) {
		(function(i) {
			Status.getOne({ run_ID: s_array[i] }, function(err, stat) {
				if (err) {
					ep.emit('getnew', { runid: s_array[i] , result: 'Judge Error' , tu: stat.time_used, mu: stat.mem_used });	
				} else {
					ep.emit('getnew', { runid: s_array[i] , result:  stat.result , tu: stat.time_used, mu: stat.mem_used });
				}
			});
		})(i);
	}
};


exports.rejudge = function(req, res, next) {
	var runid = parseInt(req.body['runid']);
	var events = ['update', 'stat', 'prob'];

	var ep = EventProxy.create(events, function(tt, stat, prob) {
		var data = config.error_string + "\n" + runid + "\n" + prob.oj;
		var client = new net.Socket();
		client.connect(config.judge_port, config.judge_host, function() {
			client.write(data);
		});
		client.on('error',function(error){
			//req.flash('error', 'The judge is temporary unavailable.Sorry.');
			Status.update({ run_ID: runid }, { result: 'Judge Error', time_used: 0, mem_used: 0 }, function(err, na, raw) {
				return res.send({ error: 1 });
			});
		});
		client.on('close', function() {
			res.send({ success: 1 });
		});

	});

	ep.fail(next);


	Status.update({ run_ID: runid },{ result: 'Judging' }, ep.done('update'));

	Status.getOne({ run_ID: runid }, function(err, stat) {
		if (err || !stat) {
			ep.unbind();
			return res.send({ error: 1 });
		}
		ep.emit('stat', stat);

		Problem.getOne({ pid: stat.pid }, function(err, prob) {
			if (err || !prob) {
				proxy.unbind();
				return res.send({ error: 1 });
			}
			ep.emit('prob', prob);
		});
	});
};
