/*!
 * NewTOJ - route.js
 */

/**
 * Module dependencies.
 */

var config = require('./config');
var auth = require('./middlewares/auth');

var site = require('./controllers/site');
var user = require('./controllers/user');
var prob = require('./controllers/prob');
var code = require('./controllers/code');
var status = require('./controllers/status');
var contest = require('./controllers/contest');
var topic = require('./controllers/topic');
var reply = require('./controllers/reply');


module.exports = function (app) {

	app.get('/admin/Problem', prob.get_update);
	app.post('/admin/Problem', prob.post_update);

	//主页
	app.get('/', site.index);

	app.get('/FAQ', site.faq);

	app.get('/PickOne', prob.getRandomOne);

	//注册相关
	app.get('/reg', auth.logoutRequired, user.get_register);
	app.post('/reg',auth.logoutRequired, user.post_register);

	//登陆相关
	app.get('/login', auth.logoutRequired, user.get_login);
	app.post('/login', auth.logoutRequired, user.post_login);

	//登出
	app.get('/logout', auth.loginRequired, user.get_logout);

	//ajax 检查用户名是否存在
	//ajax 检查密码
	app.post('/CheckUsernameExists', user.checkExists);
	app.post('/CheckPasswd', auth.loginRequired, user.post_checkPasswd);

	//修改密码
	app.get('/accounts/ChangePasswd', auth.loginRequired, user.get_changePasswd);
	app.post('/accounts/ChangePasswd', auth.loginRequired, user.post_changePasswd);

	//查看用户
	app.get('/profile/:user', user.get_profile);
	app.get('/edit_profile/edit', auth.loginRequired, user.edit_profile);
	app.post('/SaveProfile', user.save_profile);
	app.post('/user/getPunchCard', user.getPunchCard);


	app.get('/Problems', prob.getByPage);
	app.get('/ShowProblems', prob.getByPid);
	app.post('/ProblemSearch', prob.search);

	app.post('/Problem/getTags', prob.getTags);
	app.post('/Problem/addTags', prob.addTags);


	//提交题目
	app.get('/ProbSubmit', auth.loginRequired, prob.get_submit);
	app.post('/ProbSubmit', auth.loginRequired, prob.post_submit);


	app.get('/Status', status.getByPage);
	app.get('/Statistics', status.getStatistics);
	// status 刷新
	app.post('/refresh/Status', status.getUndone);
	// rejudge
	app.post('/rejudge/Status', status.rejudge);


	app.get('/ShowCode', code.getByRunid);
	app.get('/Showceerror', status.get_ce);

	app.get('/Ranklist', user.get_rank);


	//Contest 相关
	app.get('/Contest/Contests', contest.getByPage);
	app.get('/Contest/ArrangeContest', auth.loginRequired, contest.get_arrange);
	app.post('/Contest/ArrangeContest', auth.loginRequired, contest.post_arrange);

	app.get('/Contest/Settings', auth.loginRequired, contest.get_setting);
	app.post('/Contest/Settings', auth.loginRequired, contest.post_setting);
	app.post('/Contest/del', auth.loginRequired, contest.post_del);
	app.get('/Contest/Clone', auth.loginRequired, contest.clone);

	app.post('/Contest/CheckPid', contest.check_pid);

	app.get('/Contest/Enter', contest.get_enter);
	app.post('/Contest/Enter', contest.post_enter);

	app.get('/Contest/ShowContests', auth.accessRequired, contest.show_info);

	app.post('/Contest/GetProblems', contest.get_problem);
	app.get('/Contest/Problems', auth.accessRequired, contest.show_problem);

	app.get('/Contest/ShowProblems', auth.accessRequired, contest.show_one_problem);

	app.get('/Contest/ProbSubmit', auth.loginRequired, auth.accessRequired, contest.get_submit);
	app.post('/Contest/ProbSubmit', auth.loginRequired, auth.accessRequired, contest.post_submit);

	app.get('/Contest/Status', auth.accessRequired, status.contest_getByPage);
	app.get('/Contest/Statistics', auth.accessRequired, status.contest_getStatistics);

	app.get('/Contest/ShowCode', auth.accessRequired, code.getByRunid);

	app.get('/Contest/Showceerror', status.get_ce);

	app.get('/Contest/Standing', auth.accessRequired, contest.get_standing);
	app.post('/Contest/post_Standing', contest.post_standing);

	app.post('/ContestSearch', contest.search);


	//Discuss
	app.get('/Discuss', topic.index);
	app.get('/Discuss/topic/:tid', topic.get_topic);
	app.get('/Discuss/topic/:tid/top/:is_top?', topic.top);
	app.get('/Discuss/create', auth.loginRequired, topic.get_create);
	app.post('/Discuss/create', auth.loginRequired, topic.post_create);
	app.post('/Discuss/delete/:tid', auth.loginRequired, topic.delete);
	app.post('/Discuss/reply/:tid', auth.loginRequired, reply.add);
	app.post('/Discuss/reply2/:rid', auth.loginRequired, reply.add2);
};
