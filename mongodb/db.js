'use strict';

import mongoose from 'mongoose';
// 使用工具导入配置文件
import config from 'config-lite';
// 建立连接
mongoose.connect(config.url, {server:{auto_reconnect:true}});
// ？？mongoosePromise重写吗？
mongoose.Promise = global.Promise;
// 连接对象/句柄
const db = mongoose.connection;

db.once('open' ,() => {
	console.log('连接数据库成功')
})

db.on('error', function(error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});
// 考虑到了异常处理和自动重启
db.on('close', function() {
    console.log('数据库断开，重新连接数据库');
    mongoose.connect(config.url, {server:{auto_reconnect:true}});
});

export default db;
