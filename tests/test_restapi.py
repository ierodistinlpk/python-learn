#-*- encoding:utf-8-*-
import unittest
import requests
import json
from datetime import datetime

class TestAPI(unittest.TestCase):
    baseurl='http://topor.lipetsk.ru:8080/exp'
    exp_path='/rest/v1/expences'
    listed_path='/rest/v1/listed'
    auth=None
    token=''
    created_id=0
    test_currency='btc'
    def get_expences_raw(self):
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request() 
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        print('raw {0}'.format( ret.headers))
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def get_expences_with_dates(self):
        params={'from':'2019-01-07','to':'2019-02-10'}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,params=params,headers=self.auth.request.headers,cookies=self.auth.cookies)
        print (ret.text)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def get_expences_with_bad_dates(self): #should return empty list
        params={'from':'2019-03-07','to':'2019-01-10'}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,params=params,headers=self.auth.request.headers,cookies=self.auth.cookies)
        print (ret.text)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def get_expences_with_very_bad_dates(self): #should return 'BAD REQUEST'
        params={'from':'azaza','to':'YYYY-MM-dd'}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,params=params,headers=self.auth.request.headers,cookies=self.auth.cookies)
        print (ret.text)
        self.assertEqual(ret.status_code,400, 'expected status 400')

    def get_expences_401_auth_required(self):
        url=self.baseurl+self.exp_path
        ret=requests.get(url)
        self.assertEqual(ret.status_code,401, 'expected status 401')

    def post_expences_new(self):
        params={"id":"","summ":"356","exptime":"2019-02-07","description":"продукты","is_approx":False,"is_expence":True,"category":"еда","currency":"rub","location":"LPK"}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.created_id=json.loads(ret.text)[0]['id']

    def post_expences_existed(self):
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json={"id":self.created_id,"summ":"3","exptime": datetime.now().date().isoformat(),"description":"продукты","is_approx":False,"is_expence":True,"category":"еда","currency":"rub","location":"LPK"},cookies=self.auth.cookies,headers=headers)
        print (ret.text)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    # disabled because of CSRF response 403 instead 
    # def post_expences_401_auth_required(self):
    #     url=self.baseurl+self.exp_path
    #     headers={'X-CSRFToken':self.token}
    #     ret=requests.post(url,json={"id":"1675","summ":"3","exptime":"2019-02-07","description":"test","is_approx":False,"is_expence":True,"category":"еда","currency":"rub","location":"LPK"},headers=headers)
    #     print (ret.request.headers)
    #     print (ret.text)
    #     self.assertEqual(ret.status_code,401, 'expected status 401')
        
    def delete_expences_by_id(self):
        params='/'+self.created_id.__str__()
        if not self.auth:
            self.auth=self.auth_request()
        url=self.baseurl+self.exp_path+params
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.assertEqual(json.loads(ret.text),self.created_id, 'expected return {0}'.format(self.created_id))

    def delete_expences_404_not_found(self):
        params='/-1'
        if not self.auth:
            self.auth=self.auth_request()
        url=self.baseurl+self.exp_path+params
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,404, 'expected status 404')
        
    def auth_request(self):
        req=requests.get(self.baseurl+'/login')
        ###page = BeautifulSoup(req.text,'html.parser')
        self.token=req.cookies.get('csrftoken')
        print(self.token)
        req2=requests.post(self.baseurl+'/login/',data={'csrfmiddlewaretoken':self.token,'username':'iero','password':'1'},cookies=req.cookies)
        if len(req2.history):
            self.token=req2.history[0].cookies.get('csrftoken')
        print(self.token)
        return req2
    
    def get_listed(self):
        url=self.baseurl+self.listed_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        lst=['currency','category','location']
        self.assertEqual(set(json.loads(ret.text)),set(lst), 'expected list of {0}'.format(lst))
        
    def post_listed(self):
        url=self.baseurl+self.listed_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status,405, 'expected status 405')

    def delete_listed(self):
        url=self.baseurl+self.listed_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status,405, 'expected status 405')

    def get_listed_currency(self):
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def get_listed_bad_list(self):
        url=self.baseurl+self.listed_path+'/WAAAAGH!'
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,404, 'expected status 404')

    def post_listed_currency(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        print (ret.text)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def post_listed_currency_existed(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        print (ret.text)
        self.assertEqual(ret.status_code,400, 'expected status 400')

    def delete_listed_currency(self):
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status,405, 'expected status 405')

    def get_listed_currency_with_item(self):
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def post_listed_currency_with_item(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.created_id=json.loads(ret.text)[0]['id']    

    def post_listed_currency_with_item_exists(self):
        params={"name":self.test_currency}
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.created_id=json.loads(ret.text)[0]['id']    

    def delete_listed_currency_with_item(self):
        params=self.test_currency
        pass

    def delete_listed_currency_with_item_nonexists(self):
        params=self.test_currency+'aaa'
        pass
