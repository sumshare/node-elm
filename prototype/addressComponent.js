'use strict';

import BaseComponent from './baseComponent'

/*
腾讯地图和百度地图API统一调配组件
 */

// 继承了baseComponent
class AddressComponent extends BaseComponent {
	// prototype对象的constructor属性，直接指向“类”的本身
	// Point.prototype.constructor === Point // true
	constructor(){
		super();
		// super(x, y); // 调用父类的constructor(x, y)
		//都出现了super关键字，它在这里表示父类的构造函数，用来新建父类的this对象
		//子类必须在constructor方法中调用super方法，否则新建实例时会报错。这是因为子类没有自己的this对象，而是继承父类的this对象，然后对其进行加工。如果不调用super方法，子类就得不到this对象。
		// 子类的constructor方法没有调用super之前，就使用this关键字，结果报错，而放在super方法之后就是正确的。
		//super虽然代表了父类A的构造函数，但是返回的是子类B的实例，即super内部的this指的是B,,super()在这里相当于A.prototype.constructor.call(this)
		// key
		// this.fetch
		this.tencentkey = 'RLHBZ-WMPRP-Q3JDS-V2IQA-JNRFH-EJBHL';
		this.tencentkey2 = 'RRXBZ-WC6KF-ZQSJT-N2QU7-T5QIT-6KF5X';
		this.baidukey = 'fjke3YUipM9N64GdOIh1DNeK2APO2WcT';
		this.baidukey2 = 'fjke3YUipM9N64GdOIh1DNeK2APO2WcT';
	}
	// 定义“类”的方法的时候，前面不需要加上function这个关键字，直接把函数定义放进去了就可以了。另外，方法之间不需要逗号分隔，加了会报错。
	//获取定位地址 
	async guessPosition(req){
		return new Promise(async (resolve, reject) => {
			let ip = req.headers['x-forwarded-for'] || 
	 		req.connection.remoteAddress || 
	 		req.socket.remoteAddress ||
	 		req.connection.socket.remoteAddress;
	 		const ipArr = ip.split(':');
	 		ip = ipArr[ipArr.length -1];
	 		if (process.env.NODE_ENV == 'development') {
	 			ip = '116.226.184.83';
	 		}
	 		try{
	 			let result;
	 			// fetch(url = '', data = {}, type = 'GET', resType = 'JSON')
		 		result = await this.fetch('http://apis.map.qq.com/ws/location/v1/ip', {
		 			ip,
		 			key: this.tencentkey,
		 		})
		 		if (result.status !== 0) {
		 			result = await this.fetch('http://apis.map.qq.com/ws/location/v1/ip', {
			 			ip,
			 			key: this.tencentkey2,
			 		})
		 		}
		 		if (result.status == 0) {
		 			const cityInfo = {
		 				lat: result.result.location.lat,
		 				lng: result.result.location.lng,
		 				city: result.result.ad_info.city,
		 			}
		 			cityInfo.city = cityInfo.city.replace(/市$/, '');
		 			resolve(cityInfo)
		 		}else{
		 			console.log('定位失败', result)
		 			reject('定位失败');
		 		}
	 		}catch(err){
	 			reject(err);
	 		}
		})
	}
	//搜索地址
	async searchPlace(keyword, cityName, type = 'search'){
		try{
			const resObj = await this.fetch('http://apis.map.qq.com/ws/place/v1/search', {
				key: this.tencentkey,
				keyword: encodeURIComponent(keyword),
				boundary: 'region(' + encodeURIComponent(cityName) + ',0)',
				page_size: 10,
			});
			if (resObj.status == 0) {
				return resObj
			}else{
				throw new Error('搜索位置信息失败');
			}
		}catch(err){
			throw new Error(err);
		}
	}
	//测量距离
	async getDistance(from, to, type){
		try{
			let res
			res = await this.fetch('http://api.map.baidu.com/routematrix/v2/driving', {
				ak: this.baidukey,
				output: 'json',
				origins: from,
				destinations: to,
			})
			if(res.status !== 0){
				res = await this.fetch('http://api.map.baidu.com/routematrix/v2/driving', {
					ak: this.baidukey2,
					output: 'json',
					origins: from,
					destinations: to,
				})
			}
			if(res.status == 0){
				const positionArr = [];
				let timevalue;
				res.result.forEach(item => {
					timevalue = parseInt(item.duration.value) + 1200;
					let durationtime = Math.ceil(timevalue%3600/60) + '分钟';
					if(Math.floor(timevalue/3600)){
						durationtime = Math.floor(timevalue/3600) + '小时' + durationtime;
					}
					positionArr.push({
						distance: item.distance.text,
						order_lead_time: durationtime,
					})
				})
				if (type == 'tiemvalue') {
					return timevalue
				}else{
					return positionArr
				}
			}else{
				throw new Error('调用百度地图测距失败');
			}
		}catch(err){
			console.log('获取位置距离失败')
			throw new Error(err);
		}
	}
	//通过ip地址获取精确位置
	async geocoder(req){
		try{
			const address = await this.guessPosition(req);
			const res = await this.fetch('http://apis.map.qq.com/ws/geocoder/v1/', {
				key: this.tencentkey,
				location: address.lat + ',' + address.lng
			})
			if (res.status == 0) {
				return res
			}else{
				throw new Error('获取具体位置信息失败');
			}
		}catch(err){
			console.log('geocoder获取定位失败')
			throw new Error(err);
		}
	}
	//通过geohash获取精确位置
	async getpois(lat, lng){
		try{
			const res = await this.fetch('http://apis.map.qq.com/ws/geocoder/v1/', {
				key: this.tencentkey,
				location: lat + ',' + lng
			})
			if (res.status == 0) {
				return res
			}else{
				throw new Error('通过获geohash取具体位置失败');
			}
		}catch(err){
			console.log('getpois获取定位失败')
			throw new Error(err);
		}
	}
}

export default AddressComponent