'use strict';

import express from 'express'
// 阅读../prototype下相关代码，因为大部分class从这里继承
// 导入controller的方法
// 阅读v1关联代码集
import CityHandle from '../controller/v1/cities'
import SearchPlace from '../controller/v1/search'
import Carts from '../controller/v1/carts'
import Address from '../controller/v1/address'
import Remark from '../controller/v1/remark'
// 特别说明
// 七牛图床上传
import BaseComponent from '../prototype/baseComponent'
import Captchas from '../controller/v1/captchas'
import User from '../controller/v2/user'
import Order from '../controller/v1/order'
import Hongbao from '../controller/promotion/hongbao'
// 
const baseHandle = new BaseComponent();
// express.Router()方法
const router = express.Router();
// 配置API
// 具体功能配合接口文档一起查看
router.get('/cities', CityHandle.getCity);

// export default class BaseComponent{} 
// 了解class相关知识 http://es6.ruanyifeng.com/#docs/class
// constructor方法是类的默认方法，通过new命令生成对象实例时，自动调用该方法。一个类必须有constructor方法，如果没有显式定义，一个空的constructor方法会被默认添加。
// 参数是怎么传进去的？
// 去了解express.Router()的配置方法;
router.get('/cities/:id', CityHandle.getCityById);//getCityById(req, res, next){}对应router.get('/', function(req, res, next) {res.render('index', { title: 'Express' });});
router.get('/exactaddress', CityHandle.getExactAddress);
router.get('/pois', SearchPlace.search);
router.post('/addimg/:type', baseHandle.uploadImg);
router.post('/carts/checkout', Carts.checkout);
router.get('/carts/:cart_id/remarks', Remark.getRemarks);
router.post('/captchas', Captchas.getCaptchas);
router.get('/user', User.getInfo);
router.get('/user/:user_id', User.getInfoById);
router.get('/users/list', User.getUserList);
router.get('/users/count', User.getUserCount);
router.get('/users/:user_id/addresses', Address.getAddress);
router.post('/users/:user_id/addresses', Address.addAddress);
router.get('/user/city/count', User.getUserCity);
router.get('/addresse/:address_id', Address.getAddAddressById);
router.delete('/users/:user_id/addresses/:address_id', Address.deleteAddress);
router.post('/users/:user_id/carts/:cart_id/orders', Order.postOrder);
router.post('/users/:user_id/hongbao/exchange', Hongbao.exchange);

 
export default router