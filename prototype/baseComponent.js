// Fetch API它被定义在BOM的window对象中，A light-weight module that brings window.fetch to Node.js
// Node.js 中的 http 模块大部分都提供大而全的功能，比如 request、superagent，而 node-fetch 可以说是最轻量的之一，没有过度的设计。类似的还有 got。
import fetch from 'node-fetch';
// ids 数据库model，对应数据库ids这个collection
import Ids from '../models/ids'
// post方式处理起来比较麻烦，但是有了node-formidable 这个module 我们就省事多了
import formidable from 'formidable'
import path from 'path'
import fs from 'fs'
// 七牛模块
import qiniu from 'qiniu'
// 你的七牛个人面板秘钥管理AK SK
qiniu.conf.ACCESS_KEY = 'Ep714TDrVhrhZzV2VJJxDYgGHBAX-KmU1xV1SQdS';
qiniu.conf.SECRET_KEY = 'XNIW2dNffPBdaAhvm9dadBlJ-H6yyCTIJLxNM_N6';


export default class BaseComponent {
	// 了解class构建函数相关知识
	constructor(){
		this.idList = ['restaurant_id', 'food_id', 'order_id', 'user_id', 'address_id', 'cart_id', 'img_id', 'category_id', 'item_id', 'sku_id', 'admin_id', 'statis_id'];
		this.imgTypeList = ['shop', 'food', 'avatar','default'];
		// 绑定上下文到实例化对象？？
		// 用this将会是实例对象自身的属性
		// this.x = 1;
		// realobject.hasOwnProperty('x') // true
		this.uploadImg = this.uploadImg.bind(this)
		this.qiniu = this.qiniu.bind(this)
		// uploadImg 方法中this默认指向BaseComponent的实例，但是如果将方法提取出来单独使用，this会改变指向，一个比较简单的解决方法是bind(this)，在构造方法中绑定this，这样就不会qiniu找不到方法了。
		// class Logger {
			//   printName(name = 'there') {
			//     this.print(`Hello ${name}`);
			//   }

			//   print(text) {
			//     console.log(text);
			//   }
			// }

			// const logger = new Logger();
			// const { printName } = logger;
			// printName(); // TypeError: Cannot read property 'print' of undefined
		// 上面代码中，printName方法中的this，默认指向Logger类的实例。但是，如果将这个方法提取出来单独使用，this会指向该方法运行时所在的环境，因为找不到print方法而导致报错。
		// 把函数解构出来了，单独使用内部上下文并不明确
	}
	// 自定义一个fetch方法
	async fetch(url = '', data = {}, type = 'GET', resType = 'JSON'){
		type = type.toUpperCase();
		resType = resType.toUpperCase();
		if (type == 'GET') {
			let dataStr = ''; //数据拼接字符串
			Object.keys(data).forEach(key => {
				dataStr += key + '=' + data[key] + '&';
			})

			if (dataStr !== '') {
				dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
				url = url + '?' + dataStr;
			}
		}

		let requestConfig = {
			method: type,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
		}

		if (type == 'POST') {
			Object.defineProperty(requestConfig, 'body', {
				value: JSON.stringify(data)
			})
		}
		let responseJson;
		try {
			const response = await fetch(url, requestConfig);
			if (resType === 'TEXT') {
				responseJson = await response.text();
			}else{
				responseJson = await response.json();
			}
		} catch (err) {
			console.log('获取http数据失败', err);
			throw new Error(err)
		}
		return responseJson
	}
	//获取id列表，返回idData[type]的值
	async getId(type){
		if (!this.idList.includes(type)) {
			console.log('id类型错误');
			throw new Error('id类型错误');
			return
		}
		try{
			// 通过model的方法初始化一个空对象
			const idData = await Ids.findOne();
			idData[type] ++ ;
			await idData.save();
			return idData[type]
		}catch(err){
			console.log('获取ID数据失败');
			throw new Error(err)
		}
	}
	// async 配合 await 返回response 图片地址
	async uploadImg(req, res, next){
		const type = req.params.type;
		try{
			// 等待上传的结果
			const image_path = await this.qiniu(req, type);
			res.send({
				status: 1,
				image_path,
			})
		}catch(err){
			console.log('上传图片失败', err);
			res.send({
				status: 0,
				type: 'ERROR_UPLOAD_IMG',
				message: '上传图片失败'
			})
		}
		
	}
	// 图片上传，查看七牛的文档
	// https://developer.qiniu.com/kodo/sdk/1289/nodejs
	async qiniu(req, type = 'default'){
		return new Promise((resolve, reject) => {
			const form = formidable.IncomingForm();
			form.uploadDir = './public/img/' + type;

			form.parse(req, async (err, fields, files) => {
				let img_id;
				try{
					img_id = await this.getId('img_id');
				}catch(err){
					console.log('获取图片id失败');
					fs.unlink(files.file.path);
					reject('获取图片id失败')
				}
				const imgName = (new Date().getTime() + Math.ceil(Math.random()*10000)).toString(16) + img_id;
				const extname = path.extname(files.file.name);
				const repath = './public/img/' + type + '/' + imgName + extname;
				try{
					const key = imgName + extname;
					await fs.rename(files.file.path, repath);
					const token = this.uptoken('node-elm', key);
					// 上传方法uploadFile
					const qiniuImg = await this.uploadFile(token.toString(), key, repath);
					fs.unlink(repath);
					resolve(qiniuImg)
				}catch(err){
					console.log('保存至七牛失败', err);
					fs.unlink(files.file.path)
					reject('保存至七牛失败')
				}
			});

		})
	}
	//构建上传策略函数
	uptoken(bucket, key){
		// bucket要上传的空间
		// key上传到七牛后保存的文件名
		var putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
  		return putPolicy.token();
	}
	//构造上传函数
	uploadFile(uptoken, key, localFile){
		return new Promise((resolve, reject) => {
			var extra = new qiniu.io.PutExtra();
		    qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
			    if(!err) {  
			    	resolve(ret.key)
			    } else {
			    	console.log('图片上传至七牛失败', err);
			    	reject(err)
			    }
		  	});

		})
	}	
}