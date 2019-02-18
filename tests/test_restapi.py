#-*- encoding:utf-8-*-
import unittest
import requests
import json
from datetime import datetime

class TestAPI(unittest.TestCase):
    baseurl='http://topor.lipetsk.ru:8080/exp'
    exp_path='/rest/v1/expences'
    listed_path='/rest/v1/listed'
    settings_path='/rest/v1/usersettings'
    auth=None
    token=''
    created_id=0
    test_currency='btc'
    def test_get_expences_raw(self):
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request() 
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_get_expences_with_dates(self):
        params={'from':'2019-01-07','to':'2019-02-10'}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,params=params,headers=self.auth.request.headers,cookies=self.auth.cookies)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_get_expences_with_bad_dates(self): #should return empty list
        params={'from':'2019-03-07','to':'2019-01-10'}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,params=params,headers=self.auth.request.headers,cookies=self.auth.cookies)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_get_expences_with_very_bad_dates(self): #should return 'BAD REQUEST'
        params={'from':'azaza','to':'YYYY-MM-dd'}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,params=params,headers=self.auth.request.headers,cookies=self.auth.cookies)
        self.assertEqual(ret.status_code,400, 'expected status 400')

    def test_get_expences_401_auth_required(self):
        url=self.baseurl+self.exp_path
        ret=requests.get(url)
        self.assertEqual(ret.status_code,401, 'expected status 401')

    def test_post_twice_and_delete_expences(self):
        params={"id":"","summ":"356","exptime":"2019-02-07","description":"продукты","is_approx":False,"is_expence":True,"category":"еда","currency":"rub","location":"LPK"}
        url=self.baseurl+self.exp_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.created_id=json.loads(ret.text)[0]['id']
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json={"id":self.created_id,"summ":"3","exptime": datetime.now().date().isoformat(),"description":"продукты","is_approx":False,"is_expence":True,"category":"еда","currency":"rub","location":"LPK"},cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')    
        params='/'+self.created_id.__str__()
        del_url=self.baseurl+self.exp_path+params
        #headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(del_url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.assertEqual(json.loads(ret.text),self.created_id, 'expected return {0}'.format(self.created_id))

    def test_delete_expences_404_not_found(self):
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
        req2=requests.post(self.baseurl+'/login/',data={'csrfmiddlewaretoken':self.token,'username':'iero','password':'1'},cookies=req.cookies)
        if len(req2.history):
            self.token=req2.history[0].cookies.get('csrftoken')
        return req2
    
    def test_get_listed(self):
        url=self.baseurl+self.listed_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        lst=['currency','category','location']
        self.assertEqual(set(json.loads(ret.text)),set(lst), 'expected list of {0}'.format(lst))
        
    def test_post_listed(self):
        url=self.baseurl+self.listed_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,404, 'expected status 404')

    def test_delete_listed(self):
        url=self.baseurl+self.listed_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,405, 'expected status 405')

    def test_get_listed_currency(self):
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_get_listed_bad_list(self):
        url=self.baseurl+self.listed_path+'/WAAAAGH!'
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,404, 'expected status 404')

    def test_post_listed_currency(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_post_listed_currency_existed(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_delete_listed_currency(self):
        url=self.baseurl+self.listed_path+'/currency'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,405, 'expected status 405')

    def test_z_get_listed_currency_with_item(self):
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        self.assertEqual(json.loads(ret.text),self.test_currency, 'expected status 200')

    def test_post_listed_currency_with_item(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_post_listed_currency_with_item_exists(self):
        params={"name":self.test_currency}
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')

    def test_delete_listed_currency_with_item(self):
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        

    def test_delete_listed_currency_with_item_nonexists(self):
        url=self.baseurl+self.listed_path+'/currency/'+self.test_currency+'aaa'
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.delete(url,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,404, 'expected status 404')
        
    def test_get_usersettings_ok(self):
        url=self.baseurl+self.settings_path
        if not self.auth:
            self.auth=self.auth_request()
        ret=requests.get(url,cookies=self.auth.cookies,headers=self.auth.request.headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
        
    def test_get_usersettings_401_auth_required(self):
        url=self.baseurl+self.settings_path
        ret=requests.get(url)
        self.assertEqual(ret.status_code,401, 'expected status 401')
        
    def test_save_usersettings_ok(self):
        params={"currency": "rub", "location": "LPK", "category": "other"}
        url=self.baseurl+self.settings_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,200, 'expected status 200')
       

    def test_save_usersettings_bad_values(self):
        params={"currency": "rubel", "location": "LK", "category": "other"}
        url=self.baseurl+self.settings_path
        if not self.auth:
            self.auth=self.auth_request()
        headers={'X-CSRFToken':self.token,**self.auth.request.headers}
        ret=requests.post(url,json=params,cookies=self.auth.cookies,headers=headers)
        self.assertEqual(ret.status_code,400, 'expected status 400')

    

if __name__ == '__main__':
    unittest.main()
