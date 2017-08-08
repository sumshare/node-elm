// 增加了debug命令，用node-inspector进行调试
// ES6，也就是被大众称为JavaScript的ECMAScript语言规范的下一版，其工作名称为Harmony。
import express from 'express';
// 连接数据库
import db from './mongodb/db.js';
// config-lite 的作用推测是导入配置文件，其默认文件DIR是config
// https://github.com/nswbmw/config-lite
// 官方说明config_dir: config directory name, default: config.
import config from 'config-lite';
// router形式为function(app){app.use('/v1', v1);...}的回调函数，配置接口路由，各个controller配置请深入routes路径下查看
// 导入路由配置
import router from './routes/index.js';
import cookieParser from 'cookie-parser'
import session from 'express-session';
// connect-mongo是用来将connect的session持久化到mongodb中的
// const session = require('express-session');const MongoStore = require('connect-mongo')(session);app.use(session({ secret: 'foo',store: new MongoStore(options)}));
import connectMongo from 'connect-mongo';
import winston from 'winston';
import expressWinston from 'express-winston';
import path from 'path';
import history from 'connect-history-api-fallback';
import Statistic from './middlewares/statistic'

const app = express();

app.all('*', (req, res, next) => {
	res.header("Access-Control-Allow-Origin", req.headers.origin || '*');
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  	res.header("Access-Control-Allow-Credentials", true); //可以带cookies
	res.header("X-Powered-By", '3.2.1')
	if (req.method == 'OPTIONS') {
	  	res.send(200);
	} else {
	    next();
	}
});

app.use(Statistic.apiRecord)
const MongoStore = connectMongo(session);
app.use(cookieParser());
app.use(session({
	  	name: config.session.name,
		secret: config.session.secret,
		resave: true,
		saveUninitialized: false,
		cookie: config.session.cookie,
		store: new MongoStore({
	  	url: config.url
	})
}))

app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
          json: true,
          colorize: true
        }),
        new winston.transports.File({
          filename: 'logs/success.log'
        })
    ]
}));

router(app);

app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
          json: true,
          colorize: true
        }),
        new winston.transports.File({
          filename: 'logs/error.log'
        })
    ]
}));

app.use(history());
app.use(express.static('./public'));
app.listen(config.port);